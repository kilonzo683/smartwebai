import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { organization_id, backup_name, tables } = await req.json();

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "Organization ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create backup record
    const { data: backup, error: backupError } = await supabase
      .from("database_backups")
      .insert({
        organization_id,
        backup_name: backup_name || `Backup ${new Date().toISOString()}`,
        backup_type: "manual",
        status: "in_progress",
        created_by: user.id,
        started_at: new Date().toISOString(),
        tables_included: tables || [],
      })
      .select()
      .single();

    if (backupError) {
      return new Response(JSON.stringify({ error: backupError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tables to backup (organization-specific data)
    const tablesToBackup = tables?.length > 0 ? tables : [
      "conversations",
      "messages",
      "escalation_tickets",
      "knowledge_base",
      "secretary_tasks",
      "secretary_calendar_events",
      "secretary_email_drafts",
      "secretary_reminders",
      "social_brand_profiles",
      "social_campaigns",
      "social_content_calendar",
    ];

    const backupData: Record<string, unknown[]> = {};
    let totalRecords = 0;

    // Export data from each table
    for (const table of tablesToBackup) {
      try {
        let query = supabase.from(table).select("*");
        
        // Add organization filter for org-specific tables
        if (["escalation_tickets", "knowledge_base", "communication_channels", "channel_routing_rules"].includes(table)) {
          query = query.eq("organization_id", organization_id);
        }

        const { data, error } = await query;
        if (!error && data) {
          backupData[table] = data;
          totalRecords += data.length;
        }
      } catch (e) {
        console.error(`Error backing up ${table}:`, e);
      }
    }

    // Create backup file
    const backupContent = JSON.stringify({
      metadata: {
        organization_id,
        created_at: new Date().toISOString(),
        created_by: user.id,
        tables: tablesToBackup,
        total_records: totalRecords,
      },
      data: backupData,
    }, null, 2);

    const fileName = `${organization_id}/${backup.id}.json`;
    const encoder = new TextEncoder();
    const fileData = encoder.encode(backupContent);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("database-backups")
      .upload(fileName, fileData, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) {
      await supabase
        .from("database_backups")
        .update({
          status: "failed",
          error_message: uploadError.message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", backup.id);

      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update backup record
    await supabase
      .from("database_backups")
      .update({
        status: "completed",
        file_path: fileName,
        file_size: fileData.length,
        records_count: totalRecords,
        tables_included: tablesToBackup,
        completed_at: new Date().toISOString(),
      })
      .eq("id", backup.id);

    // Update backup settings
    await supabase
      .from("backup_settings")
      .update({ last_backup_at: new Date().toISOString() })
      .eq("organization_id", organization_id);

    return new Response(
      JSON.stringify({
        success: true,
        backup_id: backup.id,
        records_count: totalRecords,
        file_size: fileData.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Backup error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

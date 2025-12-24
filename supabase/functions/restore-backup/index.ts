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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { backup_id, organization_id } = await req.json();

    if (!backup_id || !organization_id) {
      return new Response(JSON.stringify({ error: "Backup ID and Organization ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get backup record
    const { data: backup, error: backupError } = await supabase
      .from("database_backups")
      .select("*")
      .eq("id", backup_id)
      .eq("organization_id", organization_id)
      .single();

    if (backupError || !backup) {
      return new Response(JSON.stringify({ error: "Backup not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!backup.file_path) {
      return new Response(JSON.stringify({ error: "Backup file not available" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download backup file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("database-backups")
      .download(backup.file_path);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: "Failed to download backup file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const backupContent = JSON.parse(await fileData.text());
    const restoredTables: string[] = [];
    let restoredRecords = 0;

    // Restore data table by table
    for (const [tableName, records] of Object.entries(backupContent.data)) {
      if (!Array.isArray(records) || records.length === 0) continue;

      try {
        // For user-specific tables, we need to filter by user or update user_id
        // This is a simplified restore - in production you'd want more sophisticated logic
        const { error: upsertError } = await supabase
          .from(tableName)
          .upsert(records as Record<string, unknown>[], { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (!upsertError) {
          restoredTables.push(tableName);
          restoredRecords += records.length;
        } else {
          console.error(`Error restoring ${tableName}:`, upsertError);
        }
      } catch (e) {
        console.error(`Error restoring ${tableName}:`, e);
      }
    }

    // Log the restore in audit
    await supabase.from("audit_log").insert({
      user_id: user.id,
      organization_id,
      action: "restore",
      resource_type: "backup",
      resource_id: backup_id,
      entity_name: backup.backup_name,
      details: {
        restored_tables: restoredTables,
        restored_records: restoredRecords,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        restored_tables: restoredTables,
        restored_records: restoredRecords,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Restore error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

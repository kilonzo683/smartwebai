import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting scheduled backup check...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all organizations with scheduled backups enabled
    const { data: settings, error: settingsError } = await supabase
      .from("backup_settings")
      .select("*, organizations(id, name)")
      .eq("is_enabled", true);

    if (settingsError) {
      console.error("Error fetching backup settings:", settingsError);
      throw settingsError;
    }

    console.log(`Found ${settings?.length || 0} organizations with scheduled backups enabled`);

    const now = new Date();
    const backupsTriggered: string[] = [];

    for (const setting of settings || []) {
      const shouldBackup = checkIfBackupNeeded(setting, now);
      
      if (shouldBackup) {
        console.log(`Triggering backup for organization: ${setting.organization_id}`);
        
        try {
          // Create backup record
          const { data: backup, error: backupError } = await supabase
            .from("database_backups")
            .insert({
              organization_id: setting.organization_id,
              backup_name: `Scheduled Backup ${now.toISOString()}`,
              backup_type: "scheduled",
              status: "in_progress",
              started_at: now.toISOString(),
              tables_included: setting.tables_to_backup || [],
            })
            .select()
            .single();

          if (backupError) {
            console.error(`Error creating backup record for ${setting.organization_id}:`, backupError);
            continue;
          }

          // Tables to backup
          const tablesToBackup = setting.tables_to_backup?.length > 0 
            ? setting.tables_to_backup 
            : [
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
                query = query.eq("organization_id", setting.organization_id);
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
              organization_id: setting.organization_id,
              created_at: now.toISOString(),
              backup_type: "scheduled",
              tables: tablesToBackup,
              total_records: totalRecords,
            },
            data: backupData,
          }, null, 2);

          const fileName = `${setting.organization_id}/${backup.id}.json`;
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
                completed_at: now.toISOString(),
              })
              .eq("id", backup.id);
            
            console.error(`Upload failed for ${setting.organization_id}:`, uploadError);
            continue;
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

          // Update settings with last backup time and calculate next backup
          const nextBackup = calculateNextBackup(setting.frequency, now);
          await supabase
            .from("backup_settings")
            .update({ 
              last_backup_at: now.toISOString(),
              next_backup_at: nextBackup.toISOString(),
            })
            .eq("id", setting.id);

          backupsTriggered.push(setting.organization_id);
          console.log(`Backup completed for ${setting.organization_id}: ${totalRecords} records`);

          // Clean up old backups based on retention
          await cleanupOldBackups(supabaseUrl, supabaseServiceKey, setting.organization_id, setting.retention_days);

        } catch (orgError) {
          console.error(`Error processing backup for ${setting.organization_id}:`, orgError);
        }
      }
    }

    console.log(`Scheduled backup job completed. Backups triggered: ${backupsTriggered.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        backups_triggered: backupsTriggered.length,
        organizations: backupsTriggered,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Scheduled backup error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function checkIfBackupNeeded(setting: { 
  frequency: string; 
  last_backup_at: string | null;
  next_backup_at: string | null;
}, now: Date): boolean {
  // If next_backup_at is set, use that
  if (setting.next_backup_at) {
    return now >= new Date(setting.next_backup_at);
  }

  // If no last backup, do one now
  if (!setting.last_backup_at) {
    return true;
  }

  const lastBackup = new Date(setting.last_backup_at);
  const hoursSinceLastBackup = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);

  switch (setting.frequency) {
    case "hourly":
      return hoursSinceLastBackup >= 1;
    case "daily":
      return hoursSinceLastBackup >= 24;
    case "weekly":
      return hoursSinceLastBackup >= 168; // 7 * 24
    default:
      return hoursSinceLastBackup >= 24;
  }
}

function calculateNextBackup(frequency: string, from: Date): Date {
  const next = new Date(from);
  
  switch (frequency) {
    case "hourly":
      next.setHours(next.getHours() + 1);
      break;
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  
  return next;
}

async function cleanupOldBackups(
  supabaseUrl: string,
  supabaseServiceKey: string,
  organizationId: string,
  retentionDays: number
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  console.log(`Cleaning up backups older than ${retentionDays} days for org ${organizationId}`);

  // Get old backups
  const { data: oldBackups, error } = await supabase
    .from("database_backups")
    .select("id, file_path")
    .eq("organization_id", organizationId)
    .eq("backup_type", "scheduled")
    .lt("created_at", cutoffDate.toISOString());

  if (error || !oldBackups) {
    console.error("Error fetching old backups:", error);
    return;
  }

  console.log(`Found ${oldBackups.length} old backups to delete`);

  for (const backup of oldBackups) {
    // Delete from storage
    if (backup.file_path) {
      await supabase.storage.from("database-backups").remove([backup.file_path]);
    }

    // Delete record
    await supabase.from("database_backups").delete().eq("id", backup.id);
  }

  console.log(`Cleaned up ${oldBackups.length} old backups`);
}

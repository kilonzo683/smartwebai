import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Database, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  RefreshCw,
  Calendar,
  HardDrive,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Backup {
  id: string;
  backup_name: string;
  backup_type: string;
  status: string;
  file_path: string | null;
  file_size: number | null;
  tables_included: string[];
  records_count: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface BackupSettings {
  id: string;
  is_enabled: boolean;
  frequency: string;
  retention_days: number;
  last_backup_at: string | null;
  next_backup_at: string | null;
}

const statusConfig = {
  pending: { icon: Clock, color: "bg-yellow-500/10 text-yellow-500" },
  in_progress: { icon: Loader2, color: "bg-blue-500/10 text-blue-500" },
  completed: { icon: CheckCircle2, color: "bg-green-500/10 text-green-500" },
  failed: { icon: XCircle, color: "bg-red-500/10 text-red-500" },
};

export function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [backupName, setBackupName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { currentOrg } = useOrganization();
  const { session } = useAuth();

  useEffect(() => {
    if (currentOrg) {
      fetchBackups();
      fetchSettings();
    }
  }, [currentOrg]);

  const fetchBackups = async () => {
    if (!currentOrg) return;
    
    try {
      const { data, error } = await supabase
        .from("database_backups")
        .select("*")
        .eq("organization_id", currentOrg.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setBackups(data || []);
    } catch (error) {
      console.error("Error fetching backups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    if (!currentOrg) return;

    const { data, error } = await supabase
      .from("backup_settings")
      .select("*")
      .eq("organization_id", currentOrg.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching settings:", error);
      return;
    }

    if (data) {
      setSettings(data);
    } else {
      // Create default settings
      const { data: newSettings } = await supabase
        .from("backup_settings")
        .insert({ organization_id: currentOrg.id })
        .select()
        .single();
      
      if (newSettings) setSettings(newSettings);
    }
  };

  const createBackup = async () => {
    if (!currentOrg || !session) return;

    setIsCreating(true);
    try {
      const response = await supabase.functions.invoke("create-backup", {
        body: {
          organization_id: currentOrg.id,
          backup_name: backupName || `Manual Backup ${new Date().toLocaleDateString()}`,
        },
      });

      if (response.error) throw response.error;

      toast.success("Backup created successfully");
      setDialogOpen(false);
      setBackupName("");
      fetchBackups();
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error creating backup:", err);
      toast.error(err.message || "Failed to create backup");
    } finally {
      setIsCreating(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!currentOrg || !session) return;

    setIsRestoring(backupId);
    try {
      const response = await supabase.functions.invoke("restore-backup", {
        body: {
          backup_id: backupId,
          organization_id: currentOrg.id,
        },
      });

      if (response.error) throw response.error;

      toast.success(`Restored ${response.data.restored_records} records from ${response.data.restored_tables.length} tables`);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error restoring backup:", err);
      toast.error(err.message || "Failed to restore backup");
    } finally {
      setIsRestoring(null);
    }
  };

  const updateSettings = async (updates: Partial<BackupSettings>) => {
    if (!currentOrg || !settings) return;

    const { error } = await supabase
      .from("backup_settings")
      .update(updates)
      .eq("id", settings.id);

    if (error) {
      toast.error("Failed to update settings");
      return;
    }

    setSettings({ ...settings, ...updates });
    toast.success("Settings updated");
  };

  const deleteBackup = async (backupId: string, filePath: string | null) => {
    if (!currentOrg) return;

    try {
      // Delete from storage if file exists
      if (filePath) {
        await supabase.storage.from("database-backups").remove([filePath]);
      }

      // Delete record
      const { error } = await supabase
        .from("database_backups")
        .delete()
        .eq("id", backupId);

      if (error) throw error;

      toast.success("Backup deleted");
      fetchBackups();
    } catch (error) {
      console.error("Error deleting backup:", error);
      toast.error("Failed to delete backup");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!currentOrg) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Select an organization to manage backups
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Backups
          </CardTitle>
          <CardDescription>
            Configure automatic database backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Scheduled Backups</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup your data on a schedule
              </p>
            </div>
            <Switch
              checked={settings?.is_enabled ?? false}
              onCheckedChange={(checked) => updateSettings({ is_enabled: checked })}
            />
          </div>

          {settings?.is_enabled && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={settings?.frequency ?? "daily"}
                  onValueChange={(value) => updateSettings({ frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Retention Period</Label>
                <Select
                  value={String(settings?.retention_days ?? 30)}
                  onValueChange={(value) => updateSettings({ retention_days: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            {settings?.last_backup_at && (
              <p>Last backup: {format(new Date(settings.last_backup_at), "PPpp")}</p>
            )}
            {settings?.next_backup_at && (
              <p>Next scheduled backup: {format(new Date(settings.next_backup_at), "PPpp")}</p>
            )}
            <p className="text-xs mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Cron job running hourly to check for due backups
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Manual Backup */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup History
              </CardTitle>
              <CardDescription>
                View and manage your database backups
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchBackups}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Create Backup
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Manual Backup</DialogTitle>
                    <DialogDescription>
                      Create a snapshot of your organization's data
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Backup Name (optional)</Label>
                      <Input
                        placeholder="e.g., Pre-migration backup"
                        value={backupName}
                        onChange={(e) => setBackupName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createBackup} disabled={isCreating}>
                      {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Backup
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No backups yet</p>
              <p className="text-sm">Create your first backup to protect your data</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => {
                  const status = statusConfig[backup.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.backup_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {backup.backup_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className={`h-3 w-3 mr-1 ${backup.status === 'in_progress' ? 'animate-spin' : ''}`} />
                          {backup.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{backup.records_count.toLocaleString()}</TableCell>
                      <TableCell>{formatFileSize(backup.file_size)}</TableCell>
                      <TableCell>
                        {format(new Date(backup.created_at), "PP")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {backup.status === "completed" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Restore Backup?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will restore data from "{backup.backup_name}". 
                                    Existing data may be overwritten. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => restoreBackup(backup.id)}
                                    disabled={isRestoring === backup.id}
                                  >
                                    {isRestoring === backup.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Restoring...
                                      </>
                                    ) : (
                                      "Restore"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Backup?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{backup.backup_name}". 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBackup(backup.id, backup.file_path)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

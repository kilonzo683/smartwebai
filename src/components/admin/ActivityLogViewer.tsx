import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Activity, Search, Filter, User, Settings, Shield, FileText, Calendar, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  entity_name: string | null;
  created_at: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <FileText className="w-4 h-4 text-green-500" />,
  update: <Settings className="w-4 h-4 text-blue-500" />,
  delete: <Shield className="w-4 h-4 text-red-500" />,
  login: <User className="w-4 h-4 text-purple-500" />,
  invite: <User className="w-4 h-4 text-orange-500" />,
  role_change: <Shield className="w-4 h-4 text-yellow-500" />,
};

const actionColors: Record<string, string> = {
  create: "bg-green-500/10 text-green-500",
  update: "bg-blue-500/10 text-blue-500",
  delete: "bg-red-500/10 text-red-500",
  login: "bg-purple-500/10 text-purple-500",
  invite: "bg-orange-500/10 text-orange-500",
  role_change: "bg-yellow-500/10 text-yellow-500",
};

export function ActivityLogViewer() {
  const { currentOrg } = useOrganization();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterResource, setFilterResource] = useState<string>("all");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (currentOrg) {
        query = query.eq("organization_id", currentOrg.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as AuditLogEntry[]) || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentOrg]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesResource = filterResource === "all" || log.resource_type === filterResource;

    return matchesSearch && matchesAction && matchesResource;
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))];
  const uniqueResources = [...new Set(logs.map((l) => l.resource_type))];

  const getActionIcon = (action: string) => {
    return actionIcons[action] || <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  const getActionBadgeClass = (action: string) => {
    return actionColors[action] || "bg-muted text-muted-foreground";
  };

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return null;
    return Object.entries(details)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => (
        <span key={key} className="inline-flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">{key}:</span>
          <span className="font-medium">{String(value)}</span>
        </span>
      ));
  };

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Logs
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterResource} onValueChange={setFilterResource}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {uniqueResources.map((resource) => (
                <SelectItem key={resource} value={resource}>
                  {resource}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-accent/30 text-center">
            <p className="text-2xl font-bold">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total Logs</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-2xl font-bold text-green-500">
              {logs.filter((l) => l.action === "create").length}
            </p>
            <p className="text-xs text-muted-foreground">Creates</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 text-center">
            <p className="text-2xl font-bold text-blue-500">
              {logs.filter((l) => l.action === "update").length}
            </p>
            <p className="text-xs text-muted-foreground">Updates</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <p className="text-2xl font-bold text-red-500">
              {logs.filter((l) => l.action === "delete").length}
            </p>
            <p className="text-xs text-muted-foreground">Deletes</p>
          </div>
        </div>

        {/* Log List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No activity logs found</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors"
                >
                  <div className="mt-0.5">{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={getActionBadgeClass(log.action)}>
                        {log.action}
                      </Badge>
                      <Badge variant="secondary">{log.resource_type}</Badge>
                      {log.entity_name && (
                        <span className="text-sm font-medium truncate">{log.entity_name}</span>
                      )}
                    </div>
                    {log.details && (
                      <div className="flex flex-wrap gap-3 mt-1">{formatDetails(log.details)}</div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                      </span>
                      {log.ip_address && (
                        <span className="font-mono">{log.ip_address}</span>
                      )}
                      <span className="font-mono text-[10px]">
                        {log.user_id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

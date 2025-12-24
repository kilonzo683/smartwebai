import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Bot, Shield, Save, Users, Briefcase, GraduationCap, HeadphonesIcon } from "lucide-react";

type AppRole = "super_admin" | "org_admin" | "staff" | "lecturer" | "support_agent" | "end_user";

interface AgentAccess {
  id: string;
  agent_type: string;
  is_enabled: boolean | null;
  allowed_roles: AppRole[];
  settings: unknown;
}

const agentInfo: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  secretary: {
    label: "AI Secretary",
    icon: <Briefcase className="w-5 h-5" />,
    description: "Task management, calendar, email drafts, and voice notes",
  },
  support: {
    label: "AI Customer Support",
    icon: <HeadphonesIcon className="w-5 h-5" />,
    description: "Ticket management, knowledge base, and customer interactions",
  },
  social: {
    label: "AI Social Media Manager",
    icon: <Users className="w-5 h-5" />,
    description: "Content creation, scheduling, and campaign management",
  },
  lecturer: {
    label: "AI Lecturer Assistant",
    icon: <GraduationCap className="w-5 h-5" />,
    description: "Quiz generation, grading, and student performance tracking",
  },
};

const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  staff: "Staff",
  lecturer: "Lecturer",
  support_agent: "Support Agent",
  end_user: "End User",
};

const editableRoles: AppRole[] = ["org_admin", "staff", "lecturer", "support_agent", "end_user"];

export function AgentPermissions() {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const [agentAccess, setAgentAccess] = useState<AgentAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchAgentAccess = async () => {
    if (!currentOrg) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("agent_access")
        .select("*")
        .eq("organization_id", currentOrg.id);

      if (error) throw error;

      // If no agent access configured, create defaults
      if (!data || data.length === 0) {
        const defaultAgents = ["secretary", "support", "social", "lecturer"];
        const defaultRoles: AppRole[] = ["org_admin", "staff"];

        const { data: newData, error: insertError } = await supabase
          .from("agent_access")
          .insert(
            defaultAgents.map((agent) => ({
              organization_id: currentOrg.id,
              agent_type: agent,
              allowed_roles: defaultRoles,
              is_enabled: true,
            }))
          )
          .select();

        if (insertError) throw insertError;
        setAgentAccess(
          (newData || []).map((item) => ({
            id: item.id,
            agent_type: item.agent_type,
            is_enabled: item.is_enabled,
            allowed_roles: item.allowed_roles as AppRole[],
            settings: item.settings,
          }))
        );
      } else {
        setAgentAccess(
          data.map((item) => ({
            id: item.id,
            agent_type: item.agent_type,
            is_enabled: item.is_enabled,
            allowed_roles: item.allowed_roles as AppRole[],
            settings: item.settings,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching agent access:", error);
      toast({
        title: "Error",
        description: "Failed to load agent permissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentAccess();
  }, [currentOrg]);

  const toggleAgentEnabled = (agentType: string) => {
    setAgentAccess((prev) =>
      prev.map((agent) =>
        agent.agent_type === agentType ? { ...agent, is_enabled: !agent.is_enabled } : agent
      )
    );
    setHasChanges(true);
  };

  const toggleRoleAccess = (agentType: string, role: AppRole) => {
    setAgentAccess((prev) =>
      prev.map((agent) => {
        if (agent.agent_type !== agentType) return agent;

        const currentRoles = agent.allowed_roles;
        const hasRole = currentRoles.includes(role);

        return {
          ...agent,
          allowed_roles: hasRole
            ? currentRoles.filter((r) => r !== role)
            : [...currentRoles, role],
        };
      })
    );
    setHasChanges(true);
  };

  const saveChanges = async () => {
    setIsSaving(true);

    try {
      for (const agent of agentAccess) {
        const { error } = await supabase
          .from("agent_access")
          .update({
            is_enabled: agent.is_enabled,
            allowed_roles: agent.allowed_roles,
          })
          .eq("id", agent.id);

        if (error) throw error;
      }

      toast({
        title: "Permissions saved",
        description: "Agent access permissions have been updated",
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving agent access:", error);
      toast({
        title: "Error",
        description: "Failed to save permissions",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!currentOrg) {
    return (
      <Card className="glass">
        <CardContent className="text-center py-12 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select an organization to manage agent permissions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Agent Permissions
          </CardTitle>
          <CardDescription>
            Control which roles can access each AI agent in {currentOrg.name}
          </CardDescription>
        </div>
        {hasChanges && (
          <Button onClick={saveChanges} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {agentAccess.map((agent) => {
          const info = agentInfo[agent.agent_type] || {
            label: agent.agent_type,
            icon: <Bot className="w-5 h-5" />,
            description: "",
          };

          return (
            <div
              key={agent.id}
              className={`p-4 rounded-lg border transition-all ${
                agent.is_enabled
                  ? "bg-accent/20 border-primary/20"
                  : "bg-muted/20 border-muted opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      agent.is_enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {info.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {info.label}
                      {!agent.is_enabled && (
                        <Badge variant="secondary" className="text-xs">
                          Disabled
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </div>
                </div>
                <Switch
                  checked={agent.is_enabled}
                  onCheckedChange={() => toggleAgentEnabled(agent.agent_type)}
                />
              </div>

              {agent.is_enabled && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm font-medium mb-3">Allowed Roles:</p>
                  <div className="flex flex-wrap gap-3">
                    {editableRoles.map((role) => (
                      <label
                        key={role}
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <Checkbox
                          checked={agent.allowed_roles.includes(role)}
                          onCheckedChange={() => toggleRoleAccess(agent.agent_type, role)}
                        />
                        <span className="text-sm">{roleLabels[role]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

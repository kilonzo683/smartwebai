import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Building2, UserPlus, LogIn } from "lucide-react";

interface InvitationDetails {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  organization?: {
    name: string;
    logo_url: string | null;
  };
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setIsLoading(false);
      return;
    }

    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("organization_invitations")
        .select(`
          id,
          organization_id,
          email,
          role,
          status,
          expires_at
        `)
        .eq("token", token)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError("Invitation not found");
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError("This invitation has expired");
        return;
      }

      // Check if already accepted
      if (data.status === "accepted") {
        setError("This invitation has already been accepted");
        return;
      }

      if (data.status === "cancelled") {
        setError("This invitation has been cancelled");
        return;
      }

      // Fetch organization details
      const { data: orgData } = await supabase
        .from("organizations")
        .select("name, logo_url")
        .eq("id", data.organization_id)
        .single();

      setInvitation({
        ...data,
        organization: orgData || undefined,
      });
    } catch (err: any) {
      console.error("Error fetching invitation:", err);
      setError("Failed to load invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation || !user) return;

    // Check if user email matches invitation email
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      toast({
        title: "Email mismatch",
        description: `This invitation was sent to ${invitation.email}. Please sign in with that email.`,
        variant: "destructive",
      });
      return;
    }

    setIsAccepting(true);

    try {
      // Add user to organization
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert([{
          organization_id: invitation.organization_id,
          user_id: user.id,
          role: invitation.role as "end_user" | "lecturer" | "org_admin" | "staff" | "super_admin" | "support_agent",
        }]);

      if (memberError) {
        if (memberError.code === "23505") {
          toast({
            title: "Already a member",
            description: "You're already a member of this organization",
          });
        } else {
          throw memberError;
        }
      }

      // Update invitation status
      await supabase
        .from("organization_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      // Log the activity
      await supabase.from("audit_log").insert({
        user_id: user.id,
        organization_id: invitation.organization_id,
        action: "invite_accepted",
        resource_type: "invitation",
        resource_id: invitation.id,
        entity_name: user.email,
      });

      toast({
        title: "Welcome!",
        description: `You've joined ${invitation.organization?.name}`,
      });

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground text-center mb-6">{error}</p>
            <Button onClick={() => navigate("/auth")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    org_admin: "Organization Admin",
    staff: "Staff Member",
    lecturer: "Lecturer",
    support_agent: "Support Agent",
    end_user: "Team Member",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription>
            Join {invitation.organization?.name} as a {roleLabels[invitation.role] || invitation.role}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-accent/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Organization</span>
              <span className="font-medium">{invitation.organization?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="font-medium">{roleLabels[invitation.role] || invitation.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invited Email</span>
              <span className="font-medium text-sm">{invitation.email}</span>
            </div>
          </div>

          {user ? (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Signed in as <strong>{user.email}</strong>
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={acceptInvitation}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Accept Invitation
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Please sign in to accept this invitation
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate(`/auth?redirect=/accept-invite?token=${token}`)}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In to Continue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

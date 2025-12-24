import { useState } from "react";
import { BookOpen, Loader2, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/hooks/use-toast";

interface ResolutionLoggerProps {
  conversationId?: string;
  ticketId?: string;
  isOpen: boolean;
  onClose: () => void;
  onLogged?: () => void;
}

export function ResolutionLogger({ 
  conversationId, 
  ticketId, 
  isOpen, 
  onClose,
  onLogged 
}: ResolutionLoggerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolution, setResolution] = useState({
    issueSummary: "",
    resolutionSummary: "",
    steps: "",
    tags: "",
    satisfaction: 0,
  });
  const { currentOrg } = useOrganization();

  const handleSubmit = async () => {
    if (!resolution.issueSummary.trim() || !resolution.resolutionSummary.trim() || !currentOrg) {
      toast({ 
        title: "Required fields missing", 
        description: "Please fill in the issue and resolution summaries",
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const tags = resolution.tags
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const steps = resolution.steps
        .split("\n")
        .filter(s => s.trim().length > 0)
        .map((s, i) => ({ step: i + 1, description: s.trim() }));

      const { error } = await supabase
        .from("support_resolutions")
        .insert({
          organization_id: currentOrg.id,
          conversation_id: conversationId || null,
          ticket_id: ticketId || null,
          issue_summary: resolution.issueSummary,
          resolution_summary: resolution.resolutionSummary,
          resolution_steps: steps,
          was_escalated: !!ticketId,
          customer_satisfaction: resolution.satisfaction > 0 ? resolution.satisfaction : null,
          tags: tags.length > 0 ? tags : null,
          created_by: session.session.user.id,
        });

      if (error) throw error;

      toast({ 
        title: "Resolution logged", 
        description: "This resolution will help improve future support" 
      });
      
      setResolution({
        issueSummary: "",
        resolutionSummary: "",
        steps: "",
        tags: "",
        satisfaction: 0,
      });
      onLogged?.();
      onClose();
    } catch (error) {
      console.error("Error logging resolution:", error);
      toast({ 
        title: "Error", 
        description: "Failed to log resolution", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-agent-support" />
            Log Resolution for Learning
          </DialogTitle>
          <DialogDescription>
            Document this resolution to help the AI learn and improve future responses.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Issue Summary *</label>
            <Textarea
              placeholder="What was the customer's problem?"
              value={resolution.issueSummary}
              onChange={(e) => setResolution(prev => ({ ...prev, issueSummary: e.target.value }))}
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Resolution Summary *</label>
            <Textarea
              placeholder="How was it resolved?"
              value={resolution.resolutionSummary}
              onChange={(e) => setResolution(prev => ({ ...prev, resolutionSummary: e.target.value }))}
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Resolution Steps (one per line)</label>
            <Textarea
              placeholder="1. First, I checked the account status&#10;2. Then I reset the password&#10;3. Verified access was restored"
              value={resolution.steps}
              onChange={(e) => setResolution(prev => ({ ...prev, steps: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Tags (comma-separated)</label>
            <Input
              placeholder="password-reset, account-access, billing"
              value={resolution.tags}
              onChange={(e) => setResolution(prev => ({ ...prev, tags: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Customer Satisfaction</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setResolution(prev => ({ 
                    ...prev, 
                    satisfaction: prev.satisfaction === star ? 0 : star 
                  }))}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star 
                    className={`w-6 h-6 ${
                      star <= resolution.satisfaction 
                        ? "text-yellow-400 fill-yellow-400" 
                        : "text-muted-foreground"
                    }`} 
                  />
                </button>
              ))}
              {resolution.satisfaction > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  {resolution.satisfaction}/5
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !resolution.issueSummary.trim() || !resolution.resolutionSummary.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Log Resolution
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

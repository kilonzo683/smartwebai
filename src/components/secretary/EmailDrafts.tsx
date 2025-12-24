import { useState, useEffect } from "react";
import { Plus, Mail, Send, Trash2, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface EmailDraft {
  id: string;
  subject: string;
  body: string;
  tone: "professional" | "friendly" | "formal" | "casual";
  recipient_email: string | null;
  status: "draft" | "sent" | "archived";
  priority: string;
  created_at: string;
}

const toneColors = {
  professional: "bg-blue-500/20 text-blue-500",
  friendly: "bg-green-500/20 text-green-500",
  formal: "bg-purple-500/20 text-purple-500",
  casual: "bg-orange-500/20 text-orange-500",
};

export function EmailDrafts() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<EmailDraft | null>(null);
  
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    tone: "professional" as EmailDraft["tone"],
    recipient_email: "",
  });

  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user]);

  const fetchDrafts = async () => {
    try {
      const { data, error } = await supabase
        .from("secretary_email_drafts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDrafts((data || []) as EmailDraft[]);
    } catch (error) {
      console.error("Error fetching drafts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.subject.trim() || !formData.body.trim() || !user) return;

    try {
      if (editingDraft) {
        const { error } = await supabase
          .from("secretary_email_drafts")
          .update({
            subject: formData.subject,
            body: formData.body,
            tone: formData.tone,
            recipient_email: formData.recipient_email || null,
          })
          .eq("id", editingDraft.id);

        if (error) throw error;
        toast({ title: "Draft updated" });
      } else {
        const { error } = await supabase
          .from("secretary_email_drafts")
          .insert({
            user_id: user.id,
            subject: formData.subject,
            body: formData.body,
            tone: formData.tone,
            recipient_email: formData.recipient_email || null,
          });

        if (error) throw error;
        toast({ title: "Draft saved" });
      }

      resetForm();
      fetchDrafts();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save draft", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({ subject: "", body: "", tone: "professional", recipient_email: "" });
    setEditingDraft(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (draft: EmailDraft) => {
    setEditingDraft(draft);
    setFormData({
      subject: draft.subject,
      body: draft.body,
      tone: draft.tone,
      recipient_email: draft.recipient_email || "",
    });
    setIsDialogOpen(true);
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from("secretary_email_drafts")
        .delete()
        .eq("id", draftId);

      if (error) throw error;
      toast({ title: "Draft deleted" });
      fetchDrafts();
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const markAsSent = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from("secretary_email_drafts")
        .update({ status: "sent" })
        .eq("id", draftId);

      if (error) throw error;
      toast({ title: "Marked as sent" });
      fetchDrafts();
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Drafts
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingDraft ? "Edit Draft" : "New Email Draft"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>To (optional)</Label>
                  <Input
                    type="email"
                    value={formData.recipient_email}
                    onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Email subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(v) => setFormData({ ...formData, tone: v as EmailDraft["tone"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Write your email..."
                    rows={6}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingDraft ? "Update Draft" : "Save Draft"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 max-h-60 overflow-y-auto">
        {drafts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No drafts</p>
        ) : (
          drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 group"
            >
              <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{draft.subject}</p>
                <p className="text-xs text-muted-foreground truncate">{draft.body.slice(0, 50)}...</p>
                {draft.recipient_email && (
                  <p className="text-xs text-muted-foreground">To: {draft.recipient_email}</p>
                )}
              </div>
              <Badge className={toneColors[draft.tone]}>{draft.tone}</Badge>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEditDialog(draft)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => markAsSent(draft.id)}>
                  <Send className="w-4 h-4 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteDraft(draft.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

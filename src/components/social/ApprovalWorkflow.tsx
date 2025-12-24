import { useState, useEffect } from "react";
import { 
  CheckCircle2, XCircle, Clock, Eye, MessageSquare, 
  Loader2, ChevronDown, User
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface PendingPost {
  id: string;
  title: string;
  content: string | null;
  platform: string;
  status: string | null;
  hashtags: string[] | null;
  scheduled_at: string | null;
  created_at: string;
  user_id: string;
}

export function ApprovalWorkflow() {
  const { user } = useAuth();
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingPosts();
  }, [user]);

  const fetchPendingPosts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("social_content_calendar")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingPosts(data || []);
    } catch (error) {
      console.error("Error fetching pending posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (post: PendingPost) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("social_content_calendar")
        .update({ 
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq("id", post.id);

      if (error) throw error;
      
      setPendingPosts(prev => prev.filter(p => p.id !== post.id));
      toast.success("Post approved successfully");
      setReviewDialogOpen(false);
    } catch (error) {
      console.error("Error approving post:", error);
      toast.error("Failed to approve post");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (post: PendingPost) => {
    if (!feedback.trim()) {
      toast.error("Please provide feedback for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("social_content_calendar")
        .update({ 
          status: "rejected",
          // Store feedback in a notes field or handle separately
        })
        .eq("id", post.id);

      if (error) throw error;
      
      setPendingPosts(prev => prev.filter(p => p.id !== post.id));
      toast.success("Post rejected with feedback");
      setReviewDialogOpen(false);
      setFeedback("");
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast.error("Failed to reject post");
    } finally {
      setIsProcessing(false);
    }
  };

  const openReviewDialog = (post: PendingPost) => {
    setSelectedPost(post);
    setFeedback("");
    setReviewDialogOpen(true);
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
    <>
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Pending Approvals
              </CardTitle>
              <CardDescription>
                Review and approve content before publishing
              </CardDescription>
            </div>
            <Badge variant="secondary">{pendingPosts.length} pending</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pendingPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>All caught up! No posts pending approval.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPosts.map((post) => (
                <Collapsible
                  key={post.id}
                  open={expandedId === post.id}
                  onOpenChange={(open) => setExpandedId(open ? post.id : null)}
                >
                  <div className="border rounded-lg p-4 hover:bg-accent/20 transition-colors">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-start justify-between cursor-pointer">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">{post.title}</h4>
                            <Badge variant="outline" className="capitalize text-xs">
                              {post.platform}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Submitted {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                          expandedId === post.id ? "rotate-180" : ""
                        }`} />
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="pt-4 mt-4 border-t">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {post.content}
                          </p>
                          {post.hashtags && post.hashtags.length > 0 && (
                            <p className="text-sm text-primary mt-2">
                              {post.hashtags.map(t => `#${t}`).join(" ")}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleApprove(post)}
                            disabled={isProcessing}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openReviewDialog(post)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => openReviewDialog(post)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Post</DialogTitle>
            <DialogDescription>
              Review content and provide feedback
            </DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="capitalize">
                    {selectedPost.platform}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedPost.title}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
                {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                  <p className="text-sm text-primary mt-2">
                    {selectedPost.hashtags.map(t => `#${t}`).join(" ")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Feedback (required for rejection)</label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback or suggestions for improvement..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleReject(selectedPost)}
                  disabled={isProcessing || !feedback.trim()}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Reject with Feedback
                </Button>
                <Button 
                  onClick={() => handleApprove(selectedPost)}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

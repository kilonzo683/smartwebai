import { useState, useEffect } from "react";
import { Calendar, Plus, Edit2, Trash2, Loader2, Clock, Check, Send, Eye } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

interface ContentPost {
  id: string;
  title: string;
  content: string | null;
  platform: string;
  post_type: string;
  hashtags: string[];
  scheduled_at: string | null;
  status: string;
  campaign_id: string | null;
}

const PLATFORMS = [
  { value: "twitter", label: "Twitter/X", icon: "𝕏" },
  { value: "instagram", label: "Instagram", icon: "📷" },
  { value: "linkedin", label: "LinkedIn", icon: "in" },
  { value: "facebook", label: "Facebook", icon: "f" },
  { value: "tiktok", label: "TikTok", icon: "♪" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400",
  pending_approval: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-blue-500/20 text-blue-400",
  scheduled: "bg-purple-500/20 text-purple-400",
  published: "bg-green-500/20 text-green-400",
};

export function ContentCalendar() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    platform: "twitter",
    post_type: "post",
    hashtags: "",
    scheduled_at: "",
    status: "draft",
  });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("social_content_calendar")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setPosts((data as ContentPost[]) || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !user) return;

    setIsSaving(true);
    try {
      const postData = {
        user_id: user.id,
        title: formData.title,
        content: formData.content || null,
        platform: formData.platform,
        post_type: formData.post_type,
        hashtags: formData.hashtags.split(",").map(h => h.trim()).filter(Boolean),
        scheduled_at: formData.scheduled_at || null,
        status: formData.status,
      };

      if (editingPost) {
        const { error } = await supabase
          .from("social_content_calendar")
          .update(postData)
          .eq("id", editingPost.id);
        if (error) throw error;
        toast({ title: "Post updated" });
      } else {
        const { error } = await supabase
          .from("social_content_calendar")
          .insert(postData);
        if (error) throw error;
        toast({ title: "Post created", description: "Added to content calendar" });
      }

      resetForm();
      fetchPosts();
    } catch (error) {
      console.error("Error saving post:", error);
      toast({ title: "Error", description: "Failed to save post", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("social_content_calendar")
        .delete()
        .eq("id", postId);
      if (error) throw error;
      toast({ title: "Post deleted" });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("social_content_calendar")
        .update({ 
          status: "approved", 
          approved_at: new Date().toISOString(),
          approved_by: user?.id 
        })
        .eq("id", postId);
      if (error) throw error;
      toast({ title: "Post approved" });
      fetchPosts();
    } catch (error) {
      console.error("Error approving post:", error);
    }
  };

  const resetForm = () => {
    setShowCreateDialog(false);
    setEditingPost(null);
    setFormData({
      title: "",
      content: "",
      platform: "twitter",
      post_type: "post",
      hashtags: "",
      scheduled_at: "",
      status: "draft",
    });
  };

  const openEdit = (post: ContentPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content || "",
      platform: post.platform,
      post_type: post.post_type,
      hashtags: post.hashtags.join(", "),
      scheduled_at: post.scheduled_at ? post.scheduled_at.slice(0, 16) : "",
      status: post.status,
    });
    setShowCreateDialog(true);
  };

  const getPostsForDay = (date: Date) => {
    return posts.filter(p => p.scheduled_at && isSameDay(new Date(p.scheduled_at), date));
  };

  const getPlatformIcon = (platform: string) => {
    return PLATFORMS.find(p => p.value === platform)?.icon || "📱";
  };

  return (
    <div className="glass rounded-2xl p-4 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-agent-social" />
          <h3 className="text-sm font-medium">Content Calendar</h3>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Week View */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const dayPosts = getPostsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 rounded-lg text-center min-h-[80px] ${
                    isToday ? "bg-agent-social/20 border border-agent-social/40" : "bg-accent/30"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
                  <div className={`text-sm font-medium ${isToday ? "text-agent-social" : ""}`}>
                    {format(day, "d")}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayPosts.slice(0, 2).map(post => (
                      <div
                        key={post.id}
                        className="text-xs px-1 py-0.5 rounded bg-background/50 truncate cursor-pointer hover:bg-background"
                        onClick={() => openEdit(post)}
                        title={post.title}
                      >
                        {getPlatformIcon(post.platform)} {post.title.slice(0, 8)}
                      </div>
                    ))}
                    {dayPosts.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{dayPosts.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upcoming Posts List */}
          <div className="border-t pt-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Upcoming Posts</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {posts.filter(p => p.status !== "published").slice(0, 5).map(post => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{getPlatformIcon(post.platform)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <div className="flex items-center gap-2">
                        {post.scheduled_at && (
                          <span className="text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {format(new Date(post.scheduled_at), "MMM d, h:mm a")}
                          </span>
                        )}
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[post.status]}`}>
                          {post.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {post.status === "pending_approval" && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleApprove(post.id)}>
                        <Check className="w-3 h-3 text-green-500" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(post)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {posts.filter(p => p.status !== "published").length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No upcoming posts</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={resetForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "Schedule New Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title *</label>
              <Input
                placeholder="Post title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Content</label>
              <Textarea
                placeholder="Write your post content..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Platform</label>
                <Select
                  value={formData.platform}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, platform: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Schedule For</label>
              <Input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Hashtags (comma-separated)</label>
              <Input
                placeholder="#marketing, #socialmedia, #growth"
                value={formData.hashtags}
                onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.title.trim()}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingPost ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

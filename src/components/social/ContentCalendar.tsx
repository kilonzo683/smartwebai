import { useState, useEffect } from "react";
import { Calendar, Plus, Edit2, Trash2, Loader2, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { PostEditor } from "./PostEditor";

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
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const { user } = useAuth();

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

  const openCreatePost = () => {
    setEditingPostId(null);
    setShowPostEditor(true);
  };

  const openEditPost = (postId: string) => {
    setEditingPostId(postId);
    setShowPostEditor(true);
  };

  const handlePostSaved = () => {
    fetchPosts();
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
        <Button size="sm" variant="outline" onClick={openCreatePost}>
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
                        onClick={() => openEditPost(post.id)}
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
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditPost(post.id)}>
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

      {/* Post Editor Dialog */}
      <PostEditor
        isOpen={showPostEditor}
        onClose={() => setShowPostEditor(false)}
        postId={editingPostId}
        onSaved={handlePostSaved}
      />
    </div>
  );
}

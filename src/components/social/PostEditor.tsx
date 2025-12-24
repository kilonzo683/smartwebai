import { useState, useEffect } from "react";
import { 
  Save, X, Calendar, Image, Hash, Send, Eye, Loader2,
  Facebook, Twitter, Instagram, Linkedin, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface PostEditorProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string | null;
  onSaved: () => void;
}

interface PostData {
  id?: string;
  title: string;
  content: string;
  platform: string;
  status: string;
  hashtags: string[];
  scheduled_at: string | null;
  post_type: string;
}

const platforms = [
  { id: "facebook", name: "Facebook", icon: Facebook },
  { id: "twitter", name: "Twitter/X", icon: Twitter },
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin },
];

export function PostEditor({ isOpen, onClose, postId, onSaved }: PostEditorProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [activeTab, setActiveTab] = useState("edit");
  
  const [post, setPost] = useState<PostData>({
    title: "",
    content: "",
    platform: "twitter",
    status: "draft",
    hashtags: [],
    scheduled_at: null,
    post_type: "post",
  });

  useEffect(() => {
    if (isOpen && postId) {
      fetchPost();
    } else if (isOpen) {
      setPost({
        title: "",
        content: "",
        platform: "twitter",
        status: "draft",
        hashtags: [],
        scheduled_at: null,
        post_type: "post",
      });
    }
  }, [isOpen, postId]);

  const fetchPost = async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("social_content_calendar")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) throw error;
      if (data) {
        setPost({
          id: data.id,
          title: data.title,
          content: data.content || "",
          platform: data.platform,
          status: data.status || "draft",
          hashtags: data.hashtags || [],
          scheduled_at: data.scheduled_at,
          post_type: data.post_type || "post",
        });
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Failed to load post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (newStatus?: string) => {
    if (!user || !post.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        user_id: user.id,
        title: post.title,
        content: post.content,
        platform: post.platform,
        status: newStatus || post.status,
        hashtags: post.hashtags,
        scheduled_at: post.scheduled_at,
        post_type: post.post_type,
      };

      if (post.id) {
        const { error } = await supabase
          .from("social_content_calendar")
          .update(saveData)
          .eq("id", post.id);

        if (error) throw error;
        toast.success("Post updated successfully");
      } else {
        const { error } = await supabase
          .from("social_content_calendar")
          .insert(saveData);

        if (error) throw error;
        toast.success("Post created successfully");
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !post.hashtags.includes(tag)) {
      setPost(prev => ({ ...prev, hashtags: [...prev.hashtags, tag] }));
    }
    setHashtagInput("");
  };

  const handleRemoveHashtag = (tag: string) => {
    setPost(prev => ({ ...prev, hashtags: prev.hashtags.filter(t => t !== tag) }));
  };

  const handleSubmitForApproval = () => {
    handleSave("pending");
  };

  const handlePublish = () => {
    handleSave("published");
  };

  const getCharacterLimit = () => {
    switch (post.platform) {
      case "twitter": return 280;
      case "linkedin": return 3000;
      case "facebook": return 63206;
      case "instagram": return 2200;
      default: return 280;
    }
  };

  const charLimit = getCharacterLimit();
  const charCount = post.content.length;
  const isOverLimit = charCount > charLimit;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post.id ? "Edit Post" : "Create New Post"}</DialogTitle>
          <DialogDescription>
            Create and schedule social media content
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-6 mt-4">
              {/* Platform Selection */}
              <div className="space-y-2">
                <Label>Platform</Label>
                <div className="flex gap-2">
                  {platforms.map((p) => (
                    <Button
                      key={p.id}
                      variant={post.platform === p.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPost(prev => ({ ...prev, platform: p.id }))}
                      className="gap-2"
                    >
                      <p.icon className="w-4 h-4" />
                      {p.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title / Internal Name</Label>
                <Input
                  id="title"
                  value={post.title}
                  onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Black Friday Promo"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Content</Label>
                  <span className={`text-xs ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
                    {charCount} / {charLimit}
                  </span>
                </div>
                <Textarea
                  id="content"
                  value={post.content}
                  onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your post content here..."
                  rows={6}
                  className={isOverLimit ? "border-destructive" : ""}
                />
              </div>

              {/* Hashtags */}
              <div className="space-y-2">
                <Label>Hashtags</Label>
                <div className="flex gap-2">
                  <Input
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddHashtag())}
                    placeholder="Add hashtag"
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleAddHashtag}>
                    <Hash className="w-4 h-4" />
                  </Button>
                </div>
                {post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        #{tag}
                        <button onClick={() => handleRemoveHashtag(tag)} className="ml-1 hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postType">Post Type</Label>
                  <Select
                    value={post.post_type}
                    onValueChange={(v) => setPost(prev => ({ ...prev, post_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">Regular Post</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="reel">Reel/Video</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Schedule For</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={post.scheduled_at ? format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm") : ""}
                    onChange={(e) => setPost(prev => ({ 
                      ...prev, 
                      scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null 
                    }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-lg p-6 bg-accent/20">
                <div className="flex items-center gap-3 mb-4">
                  {platforms.find(p => p.id === post.platform)?.icon && (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      {(() => {
                        const Icon = platforms.find(p => p.id === post.platform)?.icon || Twitter;
                        return <Icon className="w-5 h-5 text-primary" />;
                      })()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">Your Brand Name</p>
                    <p className="text-xs text-muted-foreground">@yourbrand</p>
                  </div>
                </div>
                
                <p className="text-foreground whitespace-pre-wrap mb-4">
                  {post.content || "Your post content will appear here..."}
                </p>
                
                {post.hashtags.length > 0 && (
                  <p className="text-primary text-sm mb-4">
                    {post.hashtags.map(t => `#${t}`).join(" ")}
                  </p>
                )}

                {post.scheduled_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
                    <Calendar className="w-4 h-4" />
                    <span>Scheduled for {format(new Date(post.scheduled_at), "PPP 'at' p")}</span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave()} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>
            <Button variant="secondary" onClick={handleSubmitForApproval} disabled={isSaving}>
              <Eye className="w-4 h-4 mr-2" />
              Submit for Approval
            </Button>
            <Button onClick={handlePublish} disabled={isSaving || isOverLimit}>
              <Send className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

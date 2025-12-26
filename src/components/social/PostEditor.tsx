import { useState, useEffect, useRef } from "react";
import { 
  Save, X, Calendar, Image, Hash, Send, Eye, Loader2,
  Facebook, Twitter, Instagram, Linkedin, CheckCircle2,
  Sparkles, Wand2, ImagePlus, Upload, Pencil, Check
} from "lucide-react";
import { FlyerEditor } from "./FlyerEditor";
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
  media_urls?: string[];
}

interface BrandProfile {
  brand_voice: string | null;
  key_topics: string[] | null;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [isGeneratingFlyer, setIsGeneratingFlyer] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [activeTab, setActiveTab] = useState("edit");
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [generatedFlyerUrl, setGeneratedFlyerUrl] = useState<string | null>(null);
  const [generatedFlyerUrls, setGeneratedFlyerUrls] = useState<string[]>([]); // For dual generation
  const [selectedFlyerIndex, setSelectedFlyerIndex] = useState<number>(0);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Flyer generation settings
  const [flyerStyle, setFlyerStyle] = useState<string>("modern");
  const [flyerOrientation, setFlyerOrientation] = useState<string>("square");
  const [flyerColorScheme, setFlyerColorScheme] = useState<string>("brand");
  const [flyerTextPlacement, setFlyerTextPlacement] = useState<string>("center");
  
  const [post, setPost] = useState<PostData>({
    title: "",
    content: "",
    platform: "twitter",
    status: "draft",
    hashtags: [],
    scheduled_at: null,
    post_type: "post",
    media_urls: [],
  });

  useEffect(() => {
    if (isOpen) {
      fetchBrandProfile();
      if (postId) {
        fetchPost();
      } else {
        resetPost();
      }
    }
  }, [isOpen, postId]);

  const resetPost = () => {
    setPost({
      title: "",
      content: "",
      platform: "twitter",
      status: "draft",
      hashtags: [],
      scheduled_at: null,
      post_type: "post",
      media_urls: [],
    });
    setGeneratedFlyerUrl(null);
    setGeneratedFlyerUrls([]);
    setSelectedFlyerIndex(0);
    setReferenceImage(null);
    setReferenceImageFile(null);
    setFlyerStyle("modern");
    setFlyerOrientation("square");
    setFlyerColorScheme("brand");
    setFlyerTextPlacement("center");
  };

  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setReferenceImageFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    toast.success("Reference image uploaded! AI will use this as inspiration.");
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fetchBrandProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("social_brand_profiles")
        .select("brand_voice, key_topics")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();
      
      if (data) {
        setBrandProfile(data);
      }
    } catch (error) {
      console.log("No active brand profile found");
    }
  };

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
          media_urls: data.media_urls || [],
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
      const mediaUrls = generatedFlyerUrl ? [generatedFlyerUrl] : post.media_urls;
      
      const saveData = {
        user_id: user.id,
        title: post.title,
        content: post.content,
        platform: post.platform,
        status: newStatus || post.status,
        hashtags: post.hashtags,
        scheduled_at: post.scheduled_at,
        post_type: post.post_type,
        media_urls: mediaUrls,
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

  const handleGenerateContent = async () => {
    if (!post.title.trim()) {
      toast.error("Please enter a title first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-content", {
        body: {
          type: "post",
          title: post.title,
          platform: post.platform,
          brandVoice: brandProfile?.brand_voice,
          keyTopics: brandProfile?.key_topics,
          postType: post.post_type,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPost(prev => ({ ...prev, content: data.content }));
      toast.success("Content generated!");
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!post.title.trim() && !post.content.trim()) {
      toast.error("Please enter a title or content first");
      return;
    }

    setIsGeneratingHashtags(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-content", {
        body: {
          type: "hashtags",
          title: post.title || post.content.slice(0, 100),
          platform: post.platform,
          keyTopics: brandProfile?.key_topics,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Parse hashtags from response
      const hashtags = data.content
        .split(/\s+/)
        .map((tag: string) => tag.replace(/^#/, "").trim())
        .filter((tag: string) => tag.length > 0);

      setPost(prev => ({ 
        ...prev, 
        hashtags: [...new Set([...prev.hashtags, ...hashtags])]
      }));
      toast.success("Hashtags generated!");
    } catch (error) {
      console.error("Error generating hashtags:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate hashtags");
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  const handleGenerateFlyer = async () => {
    if (!post.title.trim()) {
      toast.error("Please enter a title first");
      return;
    }

    setIsGeneratingFlyer(true);
    setGeneratedFlyerUrls([]);
    setSelectedFlyerIndex(0);
    
    try {
      // First get the flyer design prompt
      const { data: promptData, error: promptError } = await supabase.functions.invoke("generate-social-content", {
        body: {
          type: "flyer",
          title: post.title,
          platform: post.platform,
          brandVoice: brandProfile?.brand_voice,
        },
      });

      if (promptError) throw promptError;
      if (promptData?.error) throw new Error(promptData.error);

      // Generate TWO flyer variations in parallel for comparison
      const generateFlyer = async (variation: number) => {
        const { data: imageData, error: imageError } = await supabase.functions.invoke("generate-flyer-image", {
          body: {
            prompt: promptData.imagePrompt + (variation === 1 ? " Alternative creative interpretation." : ""),
            headline: promptData.headline,
            platform: post.platform,
            referenceImage: referenceImage,
            style: variation === 0 ? flyerStyle : getAlternativeStyle(flyerStyle),
            orientation: flyerOrientation,
            colorScheme: variation === 0 ? flyerColorScheme : getAlternativeColorScheme(flyerColorScheme),
            textPlacement: flyerTextPlacement,
          },
        });

        if (imageError) throw imageError;
        if (imageData?.error) throw new Error(imageData.error);
        return imageData.imageUrl;
      };

      toast.info("Generating 2 flyer variations for comparison...");
      
      // Generate both flyers in parallel
      const [flyer1, flyer2] = await Promise.all([
        generateFlyer(0),
        generateFlyer(1),
      ]);

      setGeneratedFlyerUrls([flyer1, flyer2]);
      setGeneratedFlyerUrl(flyer1); // Default to first one
      setSelectedFlyerIndex(0);
      toast.success("2 flyer variations generated! Choose your favorite.");
      setActiveTab("preview");
    } catch (error) {
      console.error("Error generating flyer:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate flyer");
    } finally {
      setIsGeneratingFlyer(false);
    }
  };

  // Helper functions for variation
  const getAlternativeStyle = (style: string): string => {
    const alternatives: Record<string, string> = {
      modern: "bold",
      bold: "modern",
      minimal: "elegant",
      retro: "playful",
      corporate: "tech",
      playful: "retro",
      elegant: "minimal",
      tech: "corporate",
    };
    return alternatives[style] || "bold";
  };

  const getAlternativeColorScheme = (scheme: string): string => {
    const alternatives: Record<string, string> = {
      brand: "gradient",
      warm: "cool",
      cool: "warm",
      monochrome: "neon",
      pastel: "earth",
      neon: "monochrome",
      earth: "pastel",
      gradient: "brand",
    };
    return alternatives[scheme] || "gradient";
  };

  const handleSelectFlyer = (index: number) => {
    setSelectedFlyerIndex(index);
    setGeneratedFlyerUrl(generatedFlyerUrls[index]);
    toast.success(`Selected flyer ${index + 1}`);
  };

  const handleEditFlyer = (imageUrl: string) => {
    setEditingImageUrl(imageUrl);
    setIsEditorOpen(true);
  };

  const handleEditorSave = (editedImageUrl: string) => {
    setGeneratedFlyerUrl(editedImageUrl);
    // Update the selected flyer in the array too
    if (generatedFlyerUrls.length > 0) {
      const newUrls = [...generatedFlyerUrls];
      newUrls[selectedFlyerIndex] = editedImageUrl;
      setGeneratedFlyerUrls(newUrls);
    }
    setIsEditorOpen(false);
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

  const handleSchedule = () => {
    if (!post.scheduled_at) {
      toast.error("Please select a schedule date and time");
      return;
    }
    handleSave("scheduled");
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
            Create and schedule social media content with AI assistance
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
                <Label htmlFor="title">Title / Topic *</Label>
                <Input
                  id="title"
                  value={post.title}
                  onChange={(e) => setPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Black Friday Promo, New Product Launch"
                />
                <p className="text-xs text-muted-foreground">
                  The AI will generate unique content based on this title
                </p>
              </div>

              {/* AI Generation Buttons */}
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateContent}
                  disabled={isGenerating || !post.title.trim()}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Generate Post
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateHashtags}
                  disabled={isGeneratingHashtags || (!post.title.trim() && !post.content.trim())}
                  className="gap-2"
                >
                  {isGeneratingHashtags ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Hash className="w-4 h-4" />
                  )}
                  Generate Hashtags
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateFlyer}
                  disabled={isGeneratingFlyer || !post.title.trim()}
                  className="gap-2"
                >
                  {isGeneratingFlyer ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImagePlus className="w-4 h-4" />
                  )}
                  Generate Flyer
                </Button>
              </div>

              {/* Flyer Settings */}
              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <h4 className="text-sm font-medium">Flyer Settings</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Style</Label>
                    <Select value={flyerStyle} onValueChange={setFlyerStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern & Clean</SelectItem>
                        <SelectItem value="bold">Bold & Vibrant</SelectItem>
                        <SelectItem value="minimal">Minimalist</SelectItem>
                        <SelectItem value="retro">Retro/Vintage</SelectItem>
                        <SelectItem value="corporate">Corporate/Professional</SelectItem>
                        <SelectItem value="playful">Playful & Fun</SelectItem>
                        <SelectItem value="elegant">Elegant & Luxury</SelectItem>
                        <SelectItem value="tech">Tech/Futuristic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Orientation</Label>
                    <Select value={flyerOrientation} onValueChange={setFlyerOrientation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square (1:1)</SelectItem>
                        <SelectItem value="portrait">Portrait (4:5)</SelectItem>
                        <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                        <SelectItem value="story">Story (9:16)</SelectItem>
                        <SelectItem value="wide">Wide Banner (2:1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Color Scheme</Label>
                    <Select value={flyerColorScheme} onValueChange={setFlyerColorScheme}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brand">Brand Colors</SelectItem>
                        <SelectItem value="warm">Warm Tones</SelectItem>
                        <SelectItem value="cool">Cool Tones</SelectItem>
                        <SelectItem value="monochrome">Monochrome</SelectItem>
                        <SelectItem value="pastel">Pastel</SelectItem>
                        <SelectItem value="neon">Neon/Bold</SelectItem>
                        <SelectItem value="earth">Earth Tones</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Text Placement</Label>
                    <Select value={flyerTextPlacement} onValueChange={setFlyerTextPlacement}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="left">Left Aligned</SelectItem>
                        <SelectItem value="right">Right Aligned</SelectItem>
                        <SelectItem value="overlay">Text Overlay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Reference Image Upload */}
              <div className="space-y-2">
                <Label>Reference Image (Optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Upload a design for the AI to use as inspiration
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReferenceImageUpload}
                  className="hidden"
                />
                {referenceImage ? (
                  <div className="relative inline-block">
                    <img
                      src={referenceImage}
                      alt="Reference design"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removeReferenceImage}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Reference
                  </Button>
                )}

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
                  placeholder="Write your post content here or use AI to generate..."
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
                    placeholder="Add hashtag manually"
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
                
                {/* Dual Flyer Comparison */}
                {generatedFlyerUrls.length === 2 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Choose Your Flyer</Label>
                      <span className="text-xs text-muted-foreground">Click to select, or edit</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {generatedFlyerUrls.map((url, index) => (
                        <div
                          key={index}
                          className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                            selectedFlyerIndex === index
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleSelectFlyer(index)}
                        >
                          {selectedFlyerIndex === index && (
                            <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                          <img
                            src={url}
                            alt={`Flyer option ${index + 1}`}
                            className="w-full h-auto"
                          />
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 gap-1 bg-background/90 hover:bg-background"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditFlyer(url);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </Button>
                          </div>
                          <div className="absolute top-2 right-2 bg-background/80 text-xs px-2 py-1 rounded">
                            Option {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single Flyer Preview (fallback) */}
                {generatedFlyerUrl && generatedFlyerUrls.length < 2 && (
                  <div className="mb-4 rounded-lg overflow-hidden border relative group">
                    <img 
                      src={generatedFlyerUrl} 
                      alt="Generated flyer" 
                      className="w-full h-auto"
                    />
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1 bg-background/90 hover:bg-background"
                        onClick={() => handleEditFlyer(generatedFlyerUrl)}
                      >
                        <Pencil className="w-3 h-3" />
                        Edit Flyer
                      </Button>
                    </div>
                  </div>
                )}
                
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
            {post.scheduled_at && (
              <Button variant="secondary" onClick={handleSchedule} disabled={isSaving}>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            )}
            <Button variant="secondary" onClick={handleSubmitForApproval} disabled={isSaving}>
              <Eye className="w-4 h-4 mr-2" />
              Submit for Approval
            </Button>
            <Button onClick={handlePublish} disabled={isSaving || isOverLimit}>
              <Send className="w-4 h-4 mr-2" />
              Publish Now
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Flyer Editor Modal */}
      <FlyerEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageUrl={editingImageUrl}
        onSave={handleEditorSave}
      />
    </Dialog>
  );
}
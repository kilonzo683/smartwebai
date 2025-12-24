import { useState, useEffect } from "react";
import { Target, Plus, Trash2, Loader2, Play, Pause, CheckCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  goals: { impressions?: number; engagement?: number; posts?: number };
  platforms: string[];
  status: string;
  performance_summary: { impressions?: number; engagement?: number; posts?: number };
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  draft: { color: "bg-gray-500/20 text-gray-400", icon: null },
  active: { color: "bg-green-500/20 text-green-400", icon: <Play className="w-3 h-3" /> },
  paused: { color: "bg-yellow-500/20 text-yellow-400", icon: <Pause className="w-3 h-3" /> },
  completed: { color: "bg-blue-500/20 text-blue-400", icon: <CheckCircle className="w-3 h-3" /> },
};

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    goal_impressions: "",
    goal_engagement: "",
    goal_posts: "",
    platforms: [] as string[],
  });

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("social_campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsed = (data || []).map(c => ({
        ...c,
        goals: (c.goals as Campaign["goals"]) || {},
        performance_summary: (c.performance_summary as Campaign["performance_summary"]) || {},
        platforms: c.platforms || [],
      }));
      setCampaigns(parsed);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !user) return;

    setIsSaving(true);
    try {
      const goals: Campaign["goals"] = {};
      if (formData.goal_impressions) goals.impressions = parseInt(formData.goal_impressions);
      if (formData.goal_engagement) goals.engagement = parseFloat(formData.goal_engagement);
      if (formData.goal_posts) goals.posts = parseInt(formData.goal_posts);

      const { error } = await supabase
        .from("social_campaigns")
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          goals,
          platforms: formData.platforms,
          status: "draft",
        });

      if (error) throw error;

      toast({ title: "Campaign created" });
      setShowCreateDialog(false);
      setFormData({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        goal_impressions: "",
        goal_engagement: "",
        goal_posts: "",
        platforms: [],
      });
      fetchCampaigns();
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({ title: "Error", description: "Failed to create campaign", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("social_campaigns")
        .update({ status: newStatus })
        .eq("id", campaignId);

      if (error) throw error;
      toast({ title: `Campaign ${newStatus}` });
      fetchCampaigns();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from("social_campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
      toast({ title: "Campaign deleted" });
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const getProgress = (campaign: Campaign) => {
    if (!campaign.start_date || !campaign.end_date) return 0;
    const total = differenceInDays(new Date(campaign.end_date), new Date(campaign.start_date));
    const elapsed = differenceInDays(new Date(), new Date(campaign.start_date));
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  return (
    <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-agent-social" />
          <h3 className="text-sm font-medium">Campaigns</h3>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-3 h-3 mr-1" />
          New
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No campaigns yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[250px] overflow-y-auto">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-medium text-sm">{campaign.name}</h4>
                  {campaign.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{campaign.description}</p>
                  )}
                </div>
                <Badge variant="outline" className={`text-xs ${STATUS_CONFIG[campaign.status]?.color}`}>
                  {STATUS_CONFIG[campaign.status]?.icon}
                  <span className="ml-1">{campaign.status}</span>
                </Badge>
              </div>

              {campaign.start_date && campaign.end_date && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{format(new Date(campaign.start_date), "MMM d")}</span>
                    <span>{format(new Date(campaign.end_date), "MMM d")}</span>
                  </div>
                  <Progress value={getProgress(campaign)} className="h-1.5" />
                </div>
              )}

              {campaign.goals && Object.keys(campaign.goals).length > 0 && (
                <div className="flex gap-2 mb-2">
                  {campaign.goals.impressions && (
                    <Badge variant="secondary" className="text-xs">
                      {campaign.goals.impressions.toLocaleString()} impressions
                    </Badge>
                  )}
                  {campaign.goals.posts && (
                    <Badge variant="secondary" className="text-xs">
                      {campaign.goals.posts} posts
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-1">
                {campaign.status === "draft" && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleStatusChange(campaign.id, "active")}>
                    <Play className="w-3 h-3 mr-1" />Start
                  </Button>
                )}
                {campaign.status === "active" && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleStatusChange(campaign.id, "paused")}>
                    <Pause className="w-3 h-3 mr-1" />Pause
                  </Button>
                )}
                {campaign.status === "paused" && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleStatusChange(campaign.id, "active")}>
                    <Play className="w-3 h-3 mr-1" />Resume
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleDelete(campaign.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Campaign Name *</label>
              <Input
                placeholder="Summer Product Launch"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea
                placeholder="Campaign description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Start Date</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">End Date</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {["twitter", "instagram", "linkedin", "facebook", "tiktok"].map(platform => (
                  <Badge
                    key={platform}
                    variant={formData.platforms.includes(platform) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePlatform(platform)}
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Goals</label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="Impressions"
                  value={formData.goal_impressions}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal_impressions: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Engagement %"
                  value={formData.goal_engagement}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal_engagement: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="# Posts"
                  value={formData.goal_posts}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal_posts: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSaving || !formData.name.trim()}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

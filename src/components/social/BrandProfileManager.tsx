import { useState, useEffect } from "react";
import { Palette, Plus, Trash2, Loader2, Save, Sparkles } from "lucide-react";
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

interface BrandProfile {
  id: string;
  brand_name: string;
  brand_voice: string | null;
  tone_examples: { text: string; platform?: string }[];
  target_audience: string | null;
  key_topics: string[];
  hashtag_groups: Record<string, string[]>;
  do_not_use: string[];
  is_active: boolean;
}

interface BrandProfileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSelect?: (profile: BrandProfile) => void;
}

const VOICE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual & Friendly" },
  { value: "playful", label: "Playful & Fun" },
  { value: "authoritative", label: "Authoritative" },
  { value: "inspirational", label: "Inspirational" },
  { value: "educational", label: "Educational" },
  { value: "witty", label: "Witty & Humorous" },
];

export function BrandProfileManager({ isOpen, onClose, onProfileSelect }: BrandProfileManagerProps) {
  const [profiles, setProfiles] = useState<BrandProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<BrandProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    brand_name: "",
    brand_voice: "professional",
    target_audience: "",
    key_topics: "",
    tone_example: "",
    do_not_use: "",
  });

  useEffect(() => {
    if (isOpen) fetchProfiles();
  }, [isOpen]);

  const fetchProfiles = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("social_brand_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsed = (data || []).map(p => ({
        ...p,
        tone_examples: Array.isArray(p.tone_examples) ? p.tone_examples as { text: string; platform?: string }[] : [],
        key_topics: p.key_topics || [],
        hashtag_groups: (p.hashtag_groups as Record<string, string[]>) || {},
        do_not_use: p.do_not_use || [],
      }));
      setProfiles(parsed);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.brand_name.trim() || !user) return;

    setIsSaving(true);
    try {
      const toneExamples = formData.tone_example.trim()
        ? [{ text: formData.tone_example }]
        : [];

      const { data, error } = await supabase
        .from("social_brand_profiles")
        .insert({
          user_id: user.id,
          brand_name: formData.brand_name,
          brand_voice: formData.brand_voice,
          target_audience: formData.target_audience || null,
          key_topics: formData.key_topics.split(",").map(t => t.trim()).filter(Boolean),
          tone_examples: toneExamples,
          do_not_use: formData.do_not_use.split(",").map(t => t.trim()).filter(Boolean),
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Brand profile created", description: `${formData.brand_name} is ready for content generation` });
      setIsCreating(false);
      setFormData({
        brand_name: "",
        brand_voice: "professional",
        target_audience: "",
        key_topics: "",
        tone_example: "",
        do_not_use: "",
      });
      fetchProfiles();
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({ title: "Error", description: "Failed to create brand profile", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from("social_brand_profiles")
        .delete()
        .eq("id", profileId);

      if (error) throw error;

      toast({ title: "Profile deleted" });
      setProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast({ title: "Error", description: "Failed to delete profile", variant: "destructive" });
    }
  };

  const handleSelectProfile = (profile: BrandProfile) => {
    onProfileSelect?.(profile);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-agent-social" />
            Brand Tone Training
          </DialogTitle>
        </DialogHeader>

        {isCreating ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Brand Name *</label>
              <Input
                placeholder="My Company"
                value={formData.brand_name}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Brand Voice</label>
              <Select
                value={formData.brand_voice}
                onValueChange={(v) => setFormData(prev => ({ ...prev, brand_voice: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Target Audience</label>
              <Input
                placeholder="Young professionals aged 25-35 interested in tech"
                value={formData.target_audience}
                onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Key Topics (comma-separated)</label>
              <Input
                placeholder="technology, innovation, productivity, AI"
                value={formData.key_topics}
                onChange={(e) => setFormData(prev => ({ ...prev, key_topics: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Example Post (for tone training)</label>
              <Textarea
                placeholder="Paste an example post that represents your brand voice..."
                value={formData.tone_example}
                onChange={(e) => setFormData(prev => ({ ...prev, tone_example: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Words/Phrases to Avoid (comma-separated)</label>
              <Input
                placeholder="synergy, leverage, disrupt"
                value={formData.do_not_use}
                onChange={(e) => setFormData(prev => ({ ...prev, do_not_use: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSaving || !formData.brand_name.trim()}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" />Save Profile</>}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <Button onClick={() => setIsCreating(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create New Brand Profile
            </Button>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No brand profiles yet</p>
                <p className="text-sm">Create one to train the AI on your brand voice</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{profile.brand_name}</h4>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="secondary">{profile.brand_voice || "No voice set"}</Badge>
                          {profile.key_topics.slice(0, 3).map(topic => (
                            <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                          ))}
                        </div>
                        {profile.target_audience && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Audience: {profile.target_audience}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSelectProfile(profile)}
                        >
                          Use
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(profile.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

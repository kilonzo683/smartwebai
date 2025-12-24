import { useState, useEffect } from "react";
import { Tag, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ConversationTaggerProps {
  conversationId: string;
  initialTags?: string[];
  onTagsChange?: (tags: string[]) => void;
}

const SUGGESTED_TAGS = [
  "billing",
  "technical",
  "account",
  "refund",
  "feature-request",
  "bug-report",
  "password",
  "urgent",
  "follow-up",
  "resolved",
];

export function ConversationTagger({ 
  conversationId, 
  initialTags = [],
  onTagsChange 
}: ConversationTaggerProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const addTag = async (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (!normalizedTag || tags.includes(normalizedTag)) return;

    const newTags = [...tags, normalizedTag];
    setTags(newTags);
    setNewTag("");
    await saveTags(newTags);
  };

  const removeTag = async (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    setTags(newTags);
    await saveTags(newTags);
  };

  const saveTags = async (newTags: string[]) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ tags: newTags })
        .eq("id", conversationId);

      if (error) throw error;
      onTagsChange?.(newTags);
    } catch (error) {
      console.error("Error saving tags:", error);
      toast({ 
        title: "Error", 
        description: "Failed to save tags", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const availableSuggestions = SUGGESTED_TAGS.filter(t => !tags.includes(t));

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag) => (
        <Badge 
          key={tag} 
          variant="secondary" 
          className="text-xs gap-1 pr-1"
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            className="ml-0.5 hover:bg-destructive/20 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Tag className="w-3 h-3 mr-1" />
                Add Tag
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="New tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addTag(newTag);
                  }
                }}
                className="h-8 text-sm"
              />
              <Button 
                size="sm" 
                className="h-8"
                onClick={() => addTag(newTag)}
                disabled={!newTag.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {availableSuggestions.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Suggested</p>
                <div className="flex flex-wrap gap-1">
                  {availableSuggestions.slice(0, 6).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-accent"
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

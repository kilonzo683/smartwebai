import { useState } from "react";
import { MessageSquare, Send, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FeedbackGeneratorProps {
  quizScore?: number;
  totalQuestions?: number;
  weakTopics?: string[];
  onFeedbackGenerated?: (feedback: string) => void;
}

const FEEDBACK_TYPES = [
  { value: "encouraging", label: "Encouraging" },
  { value: "constructive", label: "Constructive" },
  { value: "detailed", label: "Detailed Analysis" },
  { value: "brief", label: "Brief Summary" },
];

export function FeedbackGenerator({ 
  quizScore, 
  totalQuestions, 
  weakTopics = [],
  onFeedbackGenerated 
}: FeedbackGeneratorProps) {
  const [feedbackType, setFeedbackType] = useState("encouraging");
  const [customContext, setCustomContext] = useState("");
  const [generatedFeedback, setGeneratedFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateFeedback = async () => {
    setIsGenerating(true);
    try {
      const percentage = quizScore && totalQuestions 
        ? Math.round((quizScore / totalQuestions) * 100) 
        : null;

      let prompt = `Generate ${feedbackType} student feedback`;
      
      if (percentage !== null) {
        prompt += ` for a quiz score of ${percentage}% (${quizScore}/${totalQuestions} correct)`;
      }
      
      if (weakTopics.length > 0) {
        prompt += `. Areas needing improvement: ${weakTopics.join(", ")}`;
      }
      
      if (customContext) {
        prompt += `. Additional context: ${customContext}`;
      }

      prompt += `. Keep the feedback professional, helpful, and actionable. Include specific suggestions for improvement.`;

      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          agentType: "lecturer",
        },
      });

      if (error) throw error;

      // Parse streaming response
      const reader = data.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                setGeneratedFeedback(fullResponse);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      onFeedbackGenerated?.(fullResponse);
    } catch (error) {
      console.error("Error generating feedback:", error);
      toast({ 
        title: "Error", 
        description: "Failed to generate feedback. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyFeedback = () => {
    navigator.clipboard.writeText(generatedFeedback);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-agent-lecturer" />
        <h3 className="text-sm font-medium">AI Feedback Generator</h3>
      </div>

      <div className="space-y-4">
        {/* Score Display */}
        {quizScore !== undefined && totalQuestions !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Score:</span>
            <Badge variant={quizScore / totalQuestions >= 0.7 ? "default" : "secondary"}>
              {quizScore}/{totalQuestions} ({Math.round((quizScore / totalQuestions) * 100)}%)
            </Badge>
          </div>
        )}

        {/* Weak Topics */}
        {weakTopics.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">Areas to improve:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {weakTopics.map(topic => (
                <Badge key={topic} variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Type */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Feedback Style</label>
          <Select value={feedbackType} onValueChange={setFeedbackType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEEDBACK_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Context */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Additional Notes (optional)</label>
          <Textarea
            placeholder="Add any specific observations or context..."
            value={customContext}
            onChange={(e) => setCustomContext(e.target.value)}
            rows={2}
          />
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generateFeedback} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Feedback
            </>
          )}
        </Button>

        {/* Generated Feedback */}
        {generatedFeedback && (
          <div className="relative p-4 rounded-xl bg-accent/50 border">
            <div className="prose prose-sm max-w-none text-foreground">
              <p className="whitespace-pre-wrap">{generatedFeedback}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={copyFeedback}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

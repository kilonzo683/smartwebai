import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SentimentIndicatorProps {
  sentiment: "positive" | "neutral" | "negative" | null;
  confidence: number; // 0-100
  showDetails?: boolean;
  className?: string;
}

export function SentimentIndicator({ 
  sentiment, 
  confidence, 
  showDetails = false,
  className 
}: SentimentIndicatorProps) {
  const getSentimentConfig = () => {
    switch (sentiment) {
      case "positive":
        return {
          icon: TrendingUp,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          label: "Positive",
        };
      case "negative":
        return {
          icon: TrendingDown,
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          borderColor: "border-red-500/30",
          label: "Negative",
        };
      case "neutral":
        return {
          icon: Minus,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-500/30",
          label: "Neutral",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-muted-foreground",
          bgColor: "bg-muted/20",
          borderColor: "border-muted/30",
          label: "Unknown",
        };
    }
  };

  const config = getSentimentConfig();
  const Icon = config.icon;

  const getConfidenceLabel = () => {
    if (confidence >= 90) return "Very High";
    if (confidence >= 75) return "High";
    if (confidence >= 50) return "Medium";
    if (confidence >= 25) return "Low";
    return "Very Low";
  };

  const getConfidenceColor = () => {
    if (confidence >= 75) return "bg-green-500";
    if (confidence >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!showDetails) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1",
          config.bgColor,
          config.borderColor,
          config.color,
          className
        )}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Sentiment</span>
        <Badge 
          variant="outline" 
          className={cn(
            "gap-1 text-xs",
            config.bgColor,
            config.borderColor,
            config.color
          )}
        >
          <Icon className="w-3 h-3" />
          {config.label}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Confidence</span>
          <span className="text-xs font-medium">{confidence}% ({getConfidenceLabel()})</span>
        </div>
        <Progress 
          value={confidence} 
          className="h-1.5"
          // Custom color based on confidence
        />
      </div>
      
      {confidence < 50 && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-400">
            Low confidence - consider escalating to a human agent for verification.
          </p>
        </div>
      )}
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type AggregatedSignal, getDimensionLabel } from "@/hooks/useSemanticSignals";
import { AlertTriangle, CheckCircle2, Minus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalCardProps {
  signal: AggregatedSignal;
  showDimension?: boolean;
  className?: string;
}

const SENTIMENT_CONFIG = {
  positive: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
  },
  negative: {
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
  },
  neutral: {
    icon: Minus,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border",
  },
  mixed: {
    icon: Minus,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
};

export const SignalCard = ({ signal, showDimension = true, className }: SignalCardProps) => {
  const config = SENTIMENT_CONFIG[signal.sentiment] || SENTIMENT_CONFIG.neutral;
  const Icon = config.icon;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      config.bg,
      config.border,
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "mt-0.5 p-1.5 rounded-full",
            signal.sentiment === "positive" && "bg-green-100 dark:bg-green-900/50",
            signal.sentiment === "negative" && "bg-red-100 dark:bg-red-900/50",
            signal.sentiment === "neutral" && "bg-muted",
            signal.sentiment === "mixed" && "bg-amber-100 dark:bg-amber-900/50"
          )}>
            <Icon className={cn("w-4 h-4", config.color)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug mb-2">
              "{signal.signal_text}"
            </p>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{signal.voice_count} voice{signal.voice_count !== 1 ? "s" : ""}</span>
              </div>
              
              <span>•</span>
              
              <span>{signal.agreement_pct}% agreement</span>
              
              {showDimension && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {getDimensionLabel(signal.dimension)}
                  </Badge>
                </>
              )}
              
              {signal.facet && (
                <>
                  <span>•</span>
                  <span className="capitalize">{signal.facet.replace(/_/g, " ")}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Intensity indicator */}
          <div className="flex flex-col items-center gap-1">
            <div 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                signal.avg_intensity >= 7 && "bg-primary/20 text-primary",
                signal.avg_intensity >= 4 && signal.avg_intensity < 7 && "bg-muted text-muted-foreground",
                signal.avg_intensity < 4 && "bg-muted/50 text-muted-foreground/70"
              )}
            >
              {signal.avg_intensity.toFixed(0)}
            </div>
            <span className="text-[10px] text-muted-foreground">intensity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SignalListProps {
  signals: AggregatedSignal[];
  title?: string;
  emptyMessage?: string;
  showDimension?: boolean;
  className?: string;
}

export const SignalList = ({ 
  signals, 
  title, 
  emptyMessage = "No signals detected yet",
  showDimension = true,
  className 
}: SignalListProps) => {
  if (signals.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-semibold mb-3">{title}</h3>
      )}
      <div className="space-y-3">
        {signals.map(signal => (
          <SignalCard 
            key={signal.id} 
            signal={signal} 
            showDimension={showDimension}
          />
        ))}
      </div>
    </div>
  );
};

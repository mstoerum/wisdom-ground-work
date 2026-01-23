import { Shield, ShieldCheck, ShieldAlert, Share2, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataConfidenceBannerProps {
  responseCount: number;
  surveyId: string | null;
  onShareLink?: () => void;
}

const THRESHOLDS = {
  LOW: { max: 9, targetNext: 10, label: 'Limited Data', description: 'Interpret with caution' },
  MEDIUM: { max: 49, targetNext: 50, label: 'Good Confidence', description: 'Reliable for trends' },
  HIGH: { min: 50, label: 'High Confidence', description: 'Ready for decisions' },
} as const;

function getConfidenceLevel(count: number): 'low' | 'medium' | 'high' {
  if (count <= THRESHOLDS.LOW.max) return 'low';
  if (count <= THRESHOLDS.MEDIUM.max) return 'medium';
  return 'high';
}

function getProgressToNext(count: number, level: 'low' | 'medium' | 'high'): number {
  if (level === 'high') return 100;
  if (level === 'low') {
    return Math.min((count / THRESHOLDS.LOW.targetNext) * 100, 100);
  }
  return Math.min((count / THRESHOLDS.MEDIUM.targetNext) * 100, 100);
}

function getNextTarget(count: number, level: 'low' | 'medium' | 'high'): number | null {
  if (level === 'high') return null;
  if (level === 'low') return THRESHOLDS.LOW.targetNext;
  return THRESHOLDS.MEDIUM.targetNext;
}

export function DataConfidenceBanner({ 
  responseCount, 
  surveyId, 
  onShareLink 
}: DataConfidenceBannerProps) {
  if (!surveyId) return null;

  const level = getConfidenceLevel(responseCount);
  const progress = getProgressToNext(responseCount, level);
  const nextTarget = getNextTarget(responseCount, level);
  
  const config = {
    low: {
      icon: ShieldAlert,
      bgClass: 'bg-destructive/10 border-destructive/20',
      iconClass: 'text-destructive',
      progressClass: 'bg-destructive',
      label: THRESHOLDS.LOW.label,
      description: THRESHOLDS.LOW.description,
    },
    medium: {
      icon: Shield,
      bgClass: 'bg-amber-500/10 border-amber-500/20',
      iconClass: 'text-amber-600',
      progressClass: 'bg-amber-500',
      label: THRESHOLDS.MEDIUM.label,
      description: THRESHOLDS.MEDIUM.description,
    },
    high: {
      icon: ShieldCheck,
      bgClass: 'bg-emerald-500/10 border-emerald-500/20',
      iconClass: 'text-emerald-600',
      progressClass: 'bg-emerald-500',
      label: THRESHOLDS.HIGH.label,
      description: THRESHOLDS.HIGH.description,
    },
  }[level];

  const Icon = config.icon;

  return (
    <div className={cn(
      "rounded-lg border p-4 transition-all",
      config.bgClass
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn("mt-0.5", config.iconClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                Data Confidence: {config.label}
              </span>
              <span className="text-xs text-muted-foreground">
                ({responseCount} response{responseCount !== 1 ? 's' : ''})
              </span>
            </div>
            
            {level !== 'high' && nextTarget && (
              <div className="space-y-1.5">
                <Progress 
                  value={progress} 
                  className="h-1.5 bg-muted"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {nextTarget - responseCount} more response{nextTarget - responseCount !== 1 ? 's' : ''} needed for{' '}
                  {level === 'low' ? 'good' : 'high'} confidence
                </p>
              </div>
            )}
            
            {level === 'high' && (
              <p className="text-xs text-muted-foreground">
                {config.description} — insights are statistically reliable
              </p>
            )}
          </div>
        </div>
        
        {level !== 'high' && onShareLink && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onShareLink}
            className="shrink-0"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Link
          </Button>
        )}
      </div>
    </div>
  );
}

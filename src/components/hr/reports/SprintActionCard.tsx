import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Clock, 
  Zap, 
  Calendar, 
  CalendarDays,
  Users,
  ArrowRight,
  CheckCircle2 
} from "lucide-react";
import { SPRINT_TIMELINES, type SprintAction } from "@/lib/reportDesignSystem";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SprintActionCardProps {
  action: SprintAction;
  onComplete?: (actionId: string) => void;
  isCompleted?: boolean;
}

const timelineIcons = {
  immediate: Zap,
  short: Calendar,
  medium: CalendarDays,
};

export function SprintActionCard({ 
  action, 
  onComplete,
  isCompleted = false 
}: SprintActionCardProps) {
  const timeline = SPRINT_TIMELINES[action.timeline];
  const TimelineIcon = timelineIcons[action.timeline];

  const impactColors = {
    high: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative",
        isCompleted && "opacity-60"
      )}
    >
      <Card className={cn(
        "border-l-4 transition-all",
        isCompleted && "bg-muted/50"
      )} style={{ borderLeftColor: timeline.color }}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Completion checkbox */}
            {onComplete && (
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => onComplete(action.id)}
                className="mt-1"
              />
            )}

            <div className="flex-1 space-y-3">
              {/* Timeline badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant="secondary"
                  className="gap-1"
                  style={{ 
                    backgroundColor: `${timeline.color}15`,
                    color: timeline.color
                  }}
                >
                  <TimelineIcon className="h-3 w-3" />
                  {timeline.label}
                </Badge>
                
                <Badge 
                  variant="outline"
                  className={cn("text-xs", impactColors[action.impact])}
                >
                  {action.impact} impact
                </Badge>

                {action.agreementPercentage && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Users className="h-3 w-3" />
                    {action.agreementPercentage}% support
                  </Badge>
                )}
              </div>

              {/* Action text */}
              <p className={cn(
                "text-sm font-medium",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {action.text}
              </p>

              {/* Owner if assigned */}
              {action.owner && (
                <p className="text-xs text-muted-foreground">
                  Owner: {action.owner}
                </p>
              )}
            </div>

            {isCompleted && (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Sprint board layout showing all timelines
interface SprintBoardProps {
  actions: SprintAction[];
  onActionComplete?: (actionId: string) => void;
  completedActions?: string[];
}

export function SprintBoard({ 
  actions, 
  onActionComplete,
  completedActions = [] 
}: SprintBoardProps) {
  const groupedActions = {
    immediate: actions.filter(a => a.timeline === 'immediate'),
    short: actions.filter(a => a.timeline === 'short'),
    medium: actions.filter(a => a.timeline === 'medium'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ArrowRight className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Action Sprint Board</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.entries(groupedActions) as [keyof typeof SPRINT_TIMELINES, SprintAction[]][]).map(([timeline, timelineActions]) => {
          const config = SPRINT_TIMELINES[timeline];
          const TimelineIcon = timelineIcons[timeline];

          return (
            <div key={timeline} className="space-y-3">
              {/* Column header */}
              <div 
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ backgroundColor: `${config.color}15` }}
              >
                <TimelineIcon 
                  className="h-4 w-4" 
                  style={{ color: config.color }} 
                />
                <span 
                  className="font-semibold text-sm"
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {timelineActions.length}
                </Badge>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {timelineActions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No actions scheduled
                  </p>
                ) : (
                  timelineActions.map((action) => (
                    <SprintActionCard
                      key={action.id}
                      action={action}
                      onComplete={onActionComplete}
                      isCompleted={completedActions.includes(action.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

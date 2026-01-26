import { BarChart3, Share2, Users, TrendingUp, Sparkles, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type EmptyStateType = 
  | 'no-survey' 
  | 'no-responses' 
  | 'few-responses' 
  | 'limited-data'
  | 'good-data';

interface AnalyticsEmptyStateProps {
  type: EmptyStateType;
  responseCount?: number;
  sessionCount?: number;
  activeSessionCount?: number;
  surveyTitle?: string;
  onShareLink?: () => void;
  onSelectSurvey?: () => void;
}

const THRESHOLDS = {
  BASIC_INSIGHTS: 5,
  GOOD_CONFIDENCE: 10,
  HIGH_CONFIDENCE: 50,
};

function getStateConfig(type: EmptyStateType, responseCount: number = 0, sessionCount: number = 0, activeSessionCount: number = 0) {
  switch (type) {
    case 'no-survey':
      return {
        icon: BarChart3,
        title: 'Select a Survey',
        description: 'Choose a survey from the dropdown above to view detailed insights and analytics.',
        showProgress: false,
        progressLabel: '',
        target: 0,
        sessionInfo: '',
      };
    case 'no-responses':
      return {
        icon: Users,
        title: 'Waiting for Responses',
        description: sessionCount > 0 
          ? `${sessionCount} participant${sessionCount !== 1 ? 's' : ''} started but no answers recorded yet. Share the link to encourage more.`
          : 'No responses yet. Share the survey link to start collecting feedback.',
        showProgress: true,
        progressLabel: `0/${THRESHOLDS.BASIC_INSIGHTS} responses for basic insights`,
        target: THRESHOLDS.BASIC_INSIGHTS,
        sessionInfo: sessionCount > 0 ? `${sessionCount} session${sessionCount !== 1 ? 's' : ''} started` : '',
      };
    case 'few-responses':
      return {
        icon: TrendingUp,
        title: `${responseCount} Response${responseCount !== 1 ? 's' : ''} Recorded`,
        description: activeSessionCount > 0 
          ? `${THRESHOLDS.BASIC_INSIGHTS - responseCount} more needed for basic insights. ${activeSessionCount} participant${activeSessionCount !== 1 ? 's are' : ' is'} still in progress.`
          : `${THRESHOLDS.BASIC_INSIGHTS - responseCount} more needed for basic insights.`,
        showProgress: true,
        progressLabel: `${responseCount}/${THRESHOLDS.BASIC_INSIGHTS} for basic insights`,
        target: THRESHOLDS.BASIC_INSIGHTS,
        sessionInfo: sessionCount > 0 ? `${sessionCount} session${sessionCount !== 1 ? 's' : ''} (${activeSessionCount} active)` : '',
      };
    case 'limited-data':
      return {
        icon: Sparkles,
        title: 'Limited Data Available',
        description: `Basic insights are available. ${THRESHOLDS.GOOD_CONFIDENCE - responseCount} more responses will improve confidence.`,
        showProgress: true,
        progressLabel: `${responseCount}/${THRESHOLDS.GOOD_CONFIDENCE} for good confidence`,
        target: THRESHOLDS.GOOD_CONFIDENCE,
        sessionInfo: '',
      };
    case 'good-data':
      return {
        icon: Sparkles,
        title: 'Good Data',
        description: `Reliable insights available. ${THRESHOLDS.HIGH_CONFIDENCE - responseCount} more for high confidence.`,
        showProgress: true,
        progressLabel: `${responseCount}/${THRESHOLDS.HIGH_CONFIDENCE} for high confidence`,
        target: THRESHOLDS.HIGH_CONFIDENCE,
        sessionInfo: '',
      };
  }
}

export function getEmptyStateType(
  surveyId: string | null, 
  responseCount: number,
  sessionCount?: number,
  activeSessionCount?: number
): EmptyStateType | null {
  if (!surveyId) return 'no-survey';
  
  // If we have responses, show the data (not an empty state)
  if (responseCount >= THRESHOLDS.BASIC_INSIGHTS) return null;
  
  // If we have responses but fewer than threshold, show few-responses
  // (but only if we don't have theme data to show - caller should handle this)
  if (responseCount > 0 && responseCount < THRESHOLDS.BASIC_INSIGHTS) return 'few-responses';
  
  if (responseCount === 0) return 'no-responses';
  
  return null;
}

export function AnalyticsEmptyState({
  type,
  responseCount = 0,
  sessionCount = 0,
  activeSessionCount = 0,
  surveyTitle,
  onShareLink,
  onSelectSurvey,
}: AnalyticsEmptyStateProps) {
  const config = getStateConfig(type, responseCount, sessionCount, activeSessionCount);
  const Icon = config.icon;
  const progress = config.target > 0 ? (responseCount / config.target) * 100 : 0;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
        
        {surveyTitle && type !== 'no-survey' && (
          <p className="text-sm text-primary font-medium mb-1">{surveyTitle}</p>
        )}
        
        <p className="text-sm text-muted-foreground max-w-md mb-2">
          {config.description}
        </p>
        
        {/* Session info badge */}
        {config.sessionInfo && (
          <p className="text-xs text-muted-foreground/70 mb-4 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {config.sessionInfo}
          </p>
        )}

        {config.showProgress && (
          <div className="w-full max-w-xs space-y-2 mb-6">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{config.progressLabel}</p>
          </div>
        )}

        <div className="flex gap-3">
          {type === 'no-survey' && onSelectSurvey && (
            <Button onClick={onSelectSurvey}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Select Survey
            </Button>
          )}
          
          {type !== 'no-survey' && onShareLink && (
            <Button onClick={onShareLink}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Survey Link
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

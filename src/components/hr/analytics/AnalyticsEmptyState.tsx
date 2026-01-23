import { BarChart3, Share2, Users, TrendingUp, Sparkles } from "lucide-react";
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
  surveyTitle?: string;
  onShareLink?: () => void;
  onSelectSurvey?: () => void;
}

const THRESHOLDS = {
  BASIC_INSIGHTS: 5,
  GOOD_CONFIDENCE: 10,
  HIGH_CONFIDENCE: 50,
};

function getStateConfig(type: EmptyStateType, responseCount: number = 0) {
  switch (type) {
    case 'no-survey':
      return {
        icon: BarChart3,
        title: 'Select a Survey',
        description: 'Choose a survey from the dropdown above to view detailed insights and analytics.',
        showProgress: false,
        progressLabel: '',
        target: 0,
      };
    case 'no-responses':
      return {
        icon: Users,
        title: 'Waiting for Responses',
        description: 'No responses yet. Share the survey link to start collecting feedback.',
        showProgress: true,
        progressLabel: `0/${THRESHOLDS.BASIC_INSIGHTS} responses for basic insights`,
        target: THRESHOLDS.BASIC_INSIGHTS,
      };
    case 'few-responses':
      return {
        icon: TrendingUp,
        title: 'Getting Started',
        description: `You have ${responseCount} response${responseCount !== 1 ? 's' : ''}. ${THRESHOLDS.BASIC_INSIGHTS - responseCount} more needed for basic insights.`,
        showProgress: true,
        progressLabel: `${responseCount}/${THRESHOLDS.BASIC_INSIGHTS} for basic insights`,
        target: THRESHOLDS.BASIC_INSIGHTS,
      };
    case 'limited-data':
      return {
        icon: Sparkles,
        title: 'Limited Data Available',
        description: `Basic insights are available. ${THRESHOLDS.GOOD_CONFIDENCE - responseCount} more responses will improve confidence.`,
        showProgress: true,
        progressLabel: `${responseCount}/${THRESHOLDS.GOOD_CONFIDENCE} for good confidence`,
        target: THRESHOLDS.GOOD_CONFIDENCE,
      };
    case 'good-data':
      return {
        icon: Sparkles,
        title: 'Good Data',
        description: `Reliable insights available. ${THRESHOLDS.HIGH_CONFIDENCE - responseCount} more for high confidence.`,
        showProgress: true,
        progressLabel: `${responseCount}/${THRESHOLDS.HIGH_CONFIDENCE} for high confidence`,
        target: THRESHOLDS.HIGH_CONFIDENCE,
      };
  }
}

export function getEmptyStateType(
  surveyId: string | null, 
  responseCount: number
): EmptyStateType | null {
  if (!surveyId) return 'no-survey';
  if (responseCount === 0) return 'no-responses';
  if (responseCount < THRESHOLDS.BASIC_INSIGHTS) return 'few-responses';
  // Don't show empty state when we have enough data
  return null;
}

export function AnalyticsEmptyState({
  type,
  responseCount = 0,
  surveyTitle,
  onShareLink,
  onSelectSurvey,
}: AnalyticsEmptyStateProps) {
  const config = getStateConfig(type, responseCount);
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
        
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {config.description}
        </p>

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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  MessageSquare,
  Target,
  ArrowRight,
  Lightbulb,
  Zap
} from "lucide-react";
import { ParticipationMetrics, SentimentMetrics, ThemeInsight } from "@/hooks/useAnalytics";

interface AIInsightsPanelProps {
  participation: ParticipationMetrics | undefined;
  sentiment: SentimentMetrics | undefined;
  themes: ThemeInsight[];
  urgency: any[];
  previousPeriod?: {
    participation: ParticipationMetrics;
    sentiment: SentimentMetrics;
    themes: ThemeInsight[];
  };
}

interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'critical' | 'opportunity';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  data: any;
}

export const AIInsightsPanel = ({ 
  participation, 
  sentiment, 
  themes, 
  urgency,
  previousPeriod 
}: AIInsightsPanelProps) => {
  
  // Generate AI insights based on data patterns
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];
    
    if (!participation || !sentiment) return insights;

    // Participation insights
    if (participation.completionRate < 60) {
      insights.push({
        id: 'low-participation',
        type: 'warning',
        title: 'Low Participation Rate',
        description: `Only ${participation.completionRate.toFixed(1)}% of employees have completed surveys. This may indicate survey fatigue or accessibility issues.`,
        action: 'Send reminder emails, simplify survey questions, or offer incentives for completion.',
        priority: 'high',
        impact: 'high',
        data: { completionRate: participation.completionRate }
      });
    } else if (participation.completionRate > 85) {
      insights.push({
        id: 'high-participation',
        type: 'positive',
        title: 'Excellent Participation',
        description: `${participation.completionRate.toFixed(1)}% completion rate shows strong employee engagement with the feedback process.`,
        action: 'Maintain current engagement strategies and consider expanding survey frequency.',
        priority: 'low',
        impact: 'medium',
        data: { completionRate: participation.completionRate }
      });
    }

    // Sentiment insights
    if (sentiment.avgScore < 50) {
      insights.push({
        id: 'low-sentiment',
        type: 'critical',
        title: 'Critical: Low Employee Sentiment',
        description: `Average sentiment score of ${sentiment.avgScore.toFixed(1)} indicates significant employee dissatisfaction. Immediate action required.`,
        action: 'Schedule emergency leadership meeting, conduct focus groups, and implement immediate morale-boosting initiatives.',
        priority: 'high',
        impact: 'high',
        data: { avgScore: sentiment.avgScore, negative: sentiment.negative }
      });
    } else if (sentiment.avgScore > 75) {
      insights.push({
        id: 'high-sentiment',
        type: 'positive',
        title: 'Strong Employee Satisfaction',
        description: `Average sentiment of ${sentiment.avgScore.toFixed(1)} shows employees are generally satisfied with their work environment.`,
        action: 'Continue current practices and consider sharing positive feedback with the team to reinforce good behaviors.',
        priority: 'low',
        impact: 'medium',
        data: { avgScore: sentiment.avgScore }
      });
    }

    // Trend analysis
    if (previousPeriod) {
      const sentimentChange = sentiment.avgScore - previousPeriod.sentiment.avgScore;
      const participationChange = participation.completionRate - previousPeriod.participation.completionRate;
      
      if (sentimentChange < -10) {
        insights.push({
          id: 'sentiment-decline',
          type: 'critical',
          title: 'Rapid Sentiment Decline',
          description: `Employee sentiment dropped by ${Math.abs(sentimentChange).toFixed(1)} points since last period. This suggests a recent negative event or policy change.`,
          action: 'Investigate recent changes, conduct pulse surveys, and implement immediate damage control measures.',
          priority: 'high',
          impact: 'high',
          data: { change: sentimentChange, current: sentiment.avgScore, previous: previousPeriod.sentiment.avgScore }
        });
      } else if (sentimentChange > 10) {
        insights.push({
          id: 'sentiment-improvement',
          type: 'positive',
          title: 'Significant Sentiment Improvement',
          description: `Employee sentiment improved by ${sentimentChange.toFixed(1)} points. Recent initiatives are working well.`,
          action: 'Document successful strategies and consider scaling them across the organization.',
          priority: 'medium',
          impact: 'high',
          data: { change: sentimentChange }
        });
      }

      if (participationChange < -15) {
        insights.push({
          id: 'participation-drop',
          type: 'warning',
          title: 'Participation Rate Declining',
          description: `Survey participation dropped by ${Math.abs(participationChange).toFixed(1)} percentage points. This may indicate survey fatigue.`,
          action: 'Reduce survey frequency, improve survey design, or add gamification elements.',
          priority: 'medium',
          impact: 'medium',
          data: { change: participationChange }
        });
      }
    }

    // Theme-specific insights
    const concerningThemes = themes.filter(t => t.avgSentiment < 40 || t.urgencyCount > 2);
    concerningThemes.forEach(theme => {
      insights.push({
        id: `theme-${theme.id}`,
        type: theme.urgencyCount > 2 ? 'critical' : 'warning',
        title: `${theme.name} Needs Attention`,
        description: `This theme has ${theme.urgencyCount} urgent flags and low sentiment (${theme.avgSentiment.toFixed(1)}).`,
        action: `Schedule team meetings to discuss ${theme.name} concerns and develop action plans.`,
        priority: theme.urgencyCount > 2 ? 'high' : 'medium',
        impact: 'high',
        data: { theme: theme.name, sentiment: theme.avgSentiment, urgent: theme.urgencyCount }
      });
    });

    // Urgency insights
    const unresolvedUrgency = urgency.filter(u => !u.resolved_at);
    if (unresolvedUrgency.length > 5) {
      insights.push({
        id: 'high-urgency',
        type: 'critical',
        title: 'High Volume of Urgent Issues',
        description: `${unresolvedUrgency.length} urgent issues require immediate attention. This may indicate systemic problems.`,
        action: 'Prioritize urgent issues, assign dedicated resources, and implement escalation procedures.',
        priority: 'high',
        impact: 'high',
        data: { count: unresolvedUrgency.length }
      });
    }

    // Positive theme insights
    const excellentThemes = themes.filter(t => t.avgSentiment > 80 && t.urgencyCount === 0);
    if (excellentThemes.length > 0) {
      insights.push({
        id: 'excellent-themes',
        type: 'opportunity',
        title: 'Areas of Excellence Identified',
        description: `${excellentThemes.length} themes show excellent performance. These can serve as models for improvement.`,
        action: 'Document best practices from high-performing areas and share learnings across teams.',
        priority: 'low',
        impact: 'medium',
        data: { themes: excellentThemes.map(t => t.name) }
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const insights = generateInsights();

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'positive': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'opportunity': return <Lightbulb className="h-5 w-5 text-blue-600" />;
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'positive': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'critical': return 'border-red-200 bg-red-50';
      case 'opportunity': return 'border-blue-200 bg-blue-50';
    }
  };

  const getPriorityColor = (priority: Insight['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  if (!participation || !sentiment) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <Brain className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Loading AI Insights</h3>
        <p className="text-muted-foreground">Analyzing your data for actionable insights...</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI-Powered Insights
          <Badge variant="secondary" className="ml-2">
            <Zap className="h-3 w-3 mr-1" />
            {insights.length} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Systems Green</h3>
            <p className="text-muted-foreground">No critical issues detected. Your employee feedback data looks healthy!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getInsightIcon(insight.type)}
                    <div>
                      <h4 className="font-semibold text-lg">{insight.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                          {insight.priority} priority
                        </Badge>
                        <Badge variant="outline">
                          {insight.impact} impact
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">Recommended Action:</p>
                    <p className="text-sm text-muted-foreground">{insight.action}</p>
                  </div>
                  <Button size="sm" variant="outline" className="ml-4">
                    Take Action
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
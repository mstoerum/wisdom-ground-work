import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SurveyAnalytics {
  id: string;
  survey_id: string;
  executive_summary: string | null;
  top_themes: Array<{
    theme: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
    sentiment: 'positive' | 'mixed' | 'negative';
    key_finding: string;
  }>;
  sentiment_trends: {
    overall_direction: 'improving' | 'declining' | 'stable';
    momentum: string;
    inflection_points: string[];
  };
  cultural_insights: string | null;
  risk_factors: Array<{
    risk: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    likelihood: 'high' | 'medium' | 'low';
    impact_area: string;
  }>;
  opportunities: Array<{
    opportunity: string;
    potential_impact: 'high' | 'medium' | 'low';
    effort_required: 'low' | 'medium' | 'high';
  }>;
  strategic_recommendations: Array<{
    recommendation: string;
    priority: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
    expected_outcome: string;
    key_stakeholders: string[];
  }>;
  participation_analysis: string | null;
  confidence_score: number | null;
  analyzed_at: string;
  total_sessions_analyzed: number | null;
}

interface SurveyAnalyticsDashboardProps {
  analytics: SurveyAnalytics | null;
  isLoading?: boolean;
}

const importanceConfig = {
  critical: { label: "Critical", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  high: { label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  low: { label: "Low", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" }
};

const sentimentConfig = {
  positive: { icon: TrendingUp, color: "text-green-600 dark:text-green-400" },
  mixed: { icon: TrendingDown, color: "text-yellow-600 dark:text-yellow-400" },
  negative: { icon: AlertTriangle, color: "text-red-600 dark:text-red-400" }
};

const priorityConfig = {
  immediate: { label: "Immediate", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  "short-term": { label: "Short-term", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  "medium-term": { label: "Medium-term", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  "long-term": { label: "Long-term", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" }
};

export const SurveyAnalyticsDashboard = ({ analytics, isLoading }: SurveyAnalyticsDashboardProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Survey-Wide Deep Analysis
          </CardTitle>
          <CardDescription>Comprehensive AI-powered insights across all conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No analysis available yet</p>
            <p className="text-sm mt-1">Click "Run Deep Analysis" to generate comprehensive insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const SentimentIcon = sentimentConfig[analytics.sentiment_trends.overall_direction === 'improving' ? 'positive' : 
                                         analytics.sentiment_trends.overall_direction === 'declining' ? 'negative' : 'mixed'].icon;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Sessions Analyzed</p>
              <p className="text-3xl font-bold">{analytics.total_sessions_analyzed || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Confidence Score</p>
              <p className="text-3xl font-bold">{analytics.confidence_score}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center flex items-center justify-center gap-2">
              <SentimentIcon className={`w-6 h-6 ${sentimentConfig[analytics.sentiment_trends.overall_direction === 'improving' ? 'positive' : 
                                         analytics.sentiment_trends.overall_direction === 'declining' ? 'negative' : 'mixed'].color}`} />
              <div>
                <p className="text-sm text-muted-foreground">Sentiment Trend</p>
                <p className="text-lg font-bold capitalize">{analytics.sentiment_trends.overall_direction}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      {analytics.executive_summary && (
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {analytics.executive_summary}
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Analyzed {new Date(analytics.analyzed_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Top Themes */}
      {analytics.top_themes && analytics.top_themes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Strategic Themes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.top_themes.map((theme, idx) => {
              const SentimentIcon = sentimentConfig[theme.sentiment].icon;
              return (
                <div key={idx} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SentimentIcon className={`w-4 h-4 ${sentimentConfig[theme.sentiment].color}`} />
                      <h4 className="font-semibold">{theme.theme}</h4>
                    </div>
                    <Badge className={importanceConfig[theme.importance].color}>
                      {importanceConfig[theme.importance].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{theme.key_finding}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Risk Factors */}
      {analytics.risk_factors && analytics.risk_factors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.risk_factors.map((risk, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-red-900 dark:text-red-100">{risk.risk}</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {risk.severity} severity
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {risk.likelihood} likelihood
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-red-800 dark:text-red-200">Impact: {risk.impact_area}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Opportunities */}
      {analytics.opportunities && analytics.opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-green-600" />
              Strategic Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.opportunities.map((opp, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-green-900 dark:text-green-100">{opp.opportunity}</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {opp.potential_impact} impact
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {opp.effort_required} effort
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Strategic Recommendations */}
      {analytics.strategic_recommendations && analytics.strategic_recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.strategic_recommendations
              .sort((a, b) => {
                const priorityOrder = { immediate: 0, 'short-term': 1, 'medium-term': 2, 'long-term': 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              })
              .map((rec, idx) => (
                <div key={idx} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold flex-1">{rec.recommendation}</h4>
                    <Badge className={priorityConfig[rec.priority].color}>
                      {priorityConfig[rec.priority].label}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium">Expected Outcome:</span> {rec.expected_outcome}
                    </p>
                    {rec.key_stakeholders && rec.key_stakeholders.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {rec.key_stakeholders.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Cultural Insights */}
      {analytics.cultural_insights && (
        <Card>
          <CardHeader>
            <CardTitle>Cultural & Organizational Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {analytics.cultural_insights}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Participation Analysis */}
      {analytics.participation_analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Participation Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {analytics.participation_analysis}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sentiment Trends Detail */}
      {analytics.sentiment_trends.inflection_points && analytics.sentiment_trends.inflection_points.length > 0 && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Sentiment Momentum: {analytics.sentiment_trends.momentum}</p>
            <p className="text-sm">Key inflection points:</p>
            <ul className="text-sm list-disc list-inside mt-1">
              {analytics.sentiment_trends.inflection_points.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

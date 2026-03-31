import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SurveyAnalyticsDashboardProps {
  analytics: Record<string, any> | null;
  isLoading?: boolean;
}

const importanceConfig: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  high: { label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  low: { label: "Low", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" }
};

const sentimentConfig: Record<string, { icon: typeof TrendingUp; color: string }> = {
  positive: { icon: TrendingUp, color: "text-green-600 dark:text-green-400" },
  mixed: { icon: TrendingDown, color: "text-yellow-600 dark:text-yellow-400" },
  negative: { icon: AlertTriangle, color: "text-red-600 dark:text-red-400" }
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  immediate: { label: "Immediate", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  "short-term": { label: "Short-term", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  "medium-term": { label: "Medium-term", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  "long-term": { label: "Long-term", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" }
};

function deriveImportance(intensity: any): string {
  if (typeof intensity === 'number') {
    if (intensity >= 0.8) return 'critical';
    if (intensity >= 0.6) return 'high';
    if (intensity >= 0.4) return 'medium';
    return 'low';
  }
  if (typeof intensity === 'string' && importanceConfig[intensity]) return intensity;
  return 'medium';
}

function normalizePriority(p: string): string {
  return (p || 'medium-term').replace(/_/g, '-');
}

function getSentimentKey(direction: string | undefined): 'positive' | 'mixed' | 'negative' {
  if (direction === 'improving') return 'positive';
  if (direction === 'declining') return 'negative';
  return 'mixed';
}

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
            <p className="text-sm mt-1">Click "Run Full Analysis" to generate comprehensive insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sentimentTrends = analytics.sentiment_trends || {};
  const overallDirection = sentimentTrends.overall_direction || sentimentTrends.trajectory || 'stable';
  const sentimentKey = getSentimentKey(overallDirection);
  const SentimentIcon = sentimentConfig[sentimentKey].icon;

  const topThemes: any[] = analytics.top_themes || [];
  const riskFactors: any[] = analytics.risk_factors || [];
  const opportunities: any[] = analytics.opportunities || [];
  const recommendations: any[] = analytics.strategic_recommendations || [];
  const inflectionPoints: string[] = sentimentTrends.inflection_points || sentimentTrends.notable_shifts || [];

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
              <p className="text-3xl font-bold">{analytics.confidence_score ?? '—'}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center flex items-center justify-center gap-2">
              <SentimentIcon className={`w-6 h-6 ${sentimentConfig[sentimentKey].color}`} />
              <div>
                <p className="text-sm text-muted-foreground">Sentiment Trend</p>
                <p className="text-lg font-bold capitalize">{overallDirection}</p>
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
            {analytics.analyzed_at && (
              <p className="text-xs text-muted-foreground mt-4">
                Analyzed {new Date(analytics.analyzed_at).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Themes */}
      {topThemes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Strategic Themes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topThemes.map((theme: any, idx: number) => {
              const importance = theme.importance || deriveImportance(theme.intensity);
              const themeSentiment = theme.sentiment || 'mixed';
              const cfg = sentimentConfig[themeSentiment] || sentimentConfig.mixed;
              const ThemeSentimentIcon = cfg.icon;
              const impCfg = importanceConfig[importance] || importanceConfig.medium;
              return (
                <div key={idx} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ThemeSentimentIcon className={`w-4 h-4 ${cfg.color}`} />
                      <h4 className="font-semibold">{theme.theme || theme.name || 'Unknown'}</h4>
                    </div>
                    <Badge className={impCfg.color}>
                      {impCfg.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{theme.key_finding || theme.summary || ''}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskFactors.map((risk: any, idx: number) => (
              <div key={idx} className="p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-red-900 dark:text-red-100">{risk.risk || risk.title || ''}</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {risk.severity || 'medium'} severity
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {risk.likelihood || 'medium'} likelihood
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-red-800 dark:text-red-200">
                  {risk.impact_area ? `Impact: ${risk.impact_area}` : risk.mitigation || risk.evidence || ''}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-green-600" />
              Strategic Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {opportunities.map((opp: any, idx: number) => (
              <div key={idx} className="p-4 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-green-900 dark:text-green-100">{opp.opportunity || opp.title || ''}</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {opp.potential_impact || opp.impact || 'medium'} impact
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {opp.effort_required || opp.effort || 'medium'} effort
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Strategic Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...recommendations]
              .sort((a, b) => {
                const priorityOrder: Record<string, number> = { immediate: 0, 'short-term': 1, 'medium-term': 2, 'long-term': 3 };
                return (priorityOrder[normalizePriority(a.priority)] ?? 3) - (priorityOrder[normalizePriority(b.priority)] ?? 3);
              })
              .map((rec: any, idx: number) => {
                const normalizedPriority = normalizePriority(rec.priority);
                const priCfg = priorityConfig[normalizedPriority] || priorityConfig['medium-term'];
                const stakeholders: string[] = rec.key_stakeholders || [];
                const outcome = rec.expected_outcome || rec.expected_impact || rec.rationale || '';
                return (
                  <div key={idx} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold flex-1">{rec.recommendation || rec.title || ''}</h4>
                      <Badge className={priCfg.color}>
                        {priCfg.label}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      {outcome && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Expected Outcome:</span> {outcome}
                        </p>
                      )}
                      {stakeholders.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {stakeholders.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
      {inflectionPoints.length > 0 && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            {sentimentTrends.momentum && (
              <p className="font-medium mb-2">Sentiment Momentum: {sentimentTrends.momentum}</p>
            )}
            <p className="text-sm">Key inflection points:</p>
            <ul className="text-sm list-disc list-inside mt-1">
              {inflectionPoints.map((point: string, idx: number) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

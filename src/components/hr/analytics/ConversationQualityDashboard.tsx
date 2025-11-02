import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  MessageSquare,
  Target,
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { 
  AggregateQualityMetrics, 
  QualityInsight 
} from "@/lib/conversationQuality";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

interface ConversationQualityDashboardProps {
  qualityMetrics: AggregateQualityMetrics | null;
  qualityInsights: QualityInsight[];
  isLoading?: boolean;
}

export function ConversationQualityDashboard({
  qualityMetrics,
  qualityInsights,
  isLoading,
}: ConversationQualityDashboardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Analyzing conversation quality...</p>
        </CardContent>
      </Card>
    );
  }

  if (!qualityMetrics) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Quality Data Available</h3>
          <p className="text-muted-foreground mb-4">
            Quality metrics will appear here once conversation data is available.
          </p>
          <p className="text-sm text-muted-foreground">
            Quality metrics measure conversation depth, engagement, and completion to determine how reliable the analytics are.
          </p>
        </CardContent>
      </Card>
    );
  }

  const confidencePercentage = qualityMetrics.total_sessions > 0
    ? (qualityMetrics.high_confidence_count / qualityMetrics.total_sessions) * 100
    : 0;

  const getConfidenceIcon = () => {
    if (qualityMetrics.average_confidence_score >= 75) {
      return <ShieldCheck className="h-8 w-8 text-green-600" />;
    } else if (qualityMetrics.average_confidence_score >= 50) {
      return <Shield className="h-8 w-8 text-yellow-600" />;
    } else {
      return <ShieldAlert className="h-8 w-8 text-red-600" />;
    }
  };

  const getConfidenceColor = () => {
    if (qualityMetrics.average_confidence_score >= 75) return 'text-green-600';
    if (qualityMetrics.average_confidence_score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = () => {
    if (qualityMetrics.average_confidence_score >= 75) {
      return <Badge className="bg-green-100 text-green-800 border-green-300">High Confidence</Badge>;
    } else if (qualityMetrics.average_confidence_score >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Medium Confidence</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-300">Low Confidence</Badge>;
    }
  };

  // Chart data
  const confidenceDistribution = [
    { name: 'High', value: qualityMetrics.high_confidence_count, color: '#22c55e' },
    { name: 'Medium', value: qualityMetrics.medium_confidence_count, color: '#eab308' },
    { name: 'Low', value: qualityMetrics.low_confidence_count, color: '#ef4444' },
  ];

  const qualityDistribution = [
    { name: 'Excellent', value: qualityMetrics.excellent_quality, color: '#22c55e' },
    { name: 'Good', value: qualityMetrics.good_quality, color: '#84cc16' },
    { name: 'Fair', value: qualityMetrics.fair_quality, color: '#eab308' },
    { name: 'Poor', value: qualityMetrics.poor_quality, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Confidence Banner */}
      <Card className={`border-l-4 ${
        qualityMetrics.average_confidence_score >= 75 ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
        qualityMetrics.average_confidence_score >= 50 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
        'border-red-500 bg-red-50 dark:bg-red-950/20'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getConfidenceIcon()}
              <div>
                <CardTitle className="flex items-center gap-2">
                  Analytics Confidence Level
                  {getConfidenceBadge()}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on conversation quality and depth. Higher confidence means analytics are more reliable.
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getConfidenceColor()}`}>
                {qualityMetrics.average_confidence_score}/100
              </div>
              <p className="text-sm text-muted-foreground">Confidence Score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-background border">
              <div className="text-2xl font-bold text-green-600">
                {qualityMetrics.high_confidence_count}
              </div>
              <div className="text-xs text-muted-foreground">High Confidence</div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(confidencePercentage)}% of sessions
              </div>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <div className="text-2xl font-bold text-yellow-600">
                {qualityMetrics.medium_confidence_count}
              </div>
              <div className="text-xs text-muted-foreground">Medium Confidence</div>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <div className="text-2xl font-bold text-red-600">
                {qualityMetrics.low_confidence_count}
              </div>
              <div className="text-xs text-muted-foreground">Low Confidence</div>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <div className="text-2xl font-bold">
                {qualityMetrics.average_quality_score}/100
              </div>
              <div className="text-xs text-muted-foreground">Avg Quality Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Avg Exchanges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.average_exchanges}</div>
            <p className="text-xs text-muted-foreground mt-1">per conversation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Themes Explored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.average_themes_explored}</div>
            <p className="text-xs text-muted-foreground mt-1">average per session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Follow-up Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityMetrics.average_follow_up_effectiveness}%</div>
            <p className="text-xs text-muted-foreground mt-1">conversation depth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((qualityMetrics.completed_sessions / qualityMetrics.total_sessions) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {qualityMetrics.completed_sessions} of {qualityMetrics.total_sessions} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Confidence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={confidenceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {confidenceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={qualityDistribution}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {qualityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-3 rounded-lg border">
              <div className="text-lg font-bold">{qualityMetrics.confidence_factors?.high_depth_sessions ?? 0}</div>
              <div className="text-xs text-muted-foreground">High Depth Sessions</div>
              <div className="text-xs text-muted-foreground mt-1">3+ themes explored</div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-lg font-bold">{qualityMetrics.confidence_factors?.high_engagement_sessions ?? 0}</div>
              <div className="text-xs text-muted-foreground">High Engagement</div>
              <div className="text-xs text-muted-foreground mt-1">8+ exchanges</div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-lg font-bold">{qualityMetrics.confidence_factors?.completed_sessions ?? 0}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="text-xs text-muted-foreground mt-1">Not abandoned</div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-lg font-bold">{qualityMetrics.confidence_factors?.mood_tracked_sessions ?? 0}</div>
              <div className="text-xs text-muted-foreground">Mood Tracked</div>
              <div className="text-xs text-muted-foreground mt-1">Initial & final mood</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Insights */}
      {qualityInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {qualityInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'strength'
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                      : 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {insight.type === 'strength' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      {insight.recommendation && (
                        <div className="mt-2 p-2 rounded bg-background border">
                          <p className="text-xs font-medium mb-1">Recommendation:</p>
                          <p className="text-xs text-muted-foreground">{insight.recommendation}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {insight.affected_sessions} sessions
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            insight.impact === 'high' ? 'border-red-300 text-red-700' :
                            insight.impact === 'medium' ? 'border-yellow-300 text-yellow-700' :
                            'border-blue-300 text-blue-700'
                          }`}
                        >
                          {insight.impact} impact
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

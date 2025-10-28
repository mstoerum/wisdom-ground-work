import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Heart, 
  Shield, 
  AlertTriangle,
  Users,
  MessageSquare,
  Target,
  Lightbulb
} from "lucide-react";
import { useEnhancedAnalytics } from "@/hooks/useEnhancedAnalytics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface EnhancedAnalyticsDashboardProps {
  filters: {
    surveyId?: string;
    startDate?: Date;
    endDate?: Date;
    department?: string;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export const EnhancedAnalyticsDashboard = ({ filters }: EnhancedAnalyticsDashboardProps) => {
  const { data: analytics, isLoading } = useEnhancedAnalytics(filters);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversationQuality.engagementScore}</div>
            <div className="flex items-center space-x-2">
              <Progress value={analytics.conversationQuality.engagementScore} className="flex-1" />
              <Badge variant={analytics.conversationQuality.engagementScore > 70 ? "default" : "secondary"}>
                {analytics.conversationQuality.responseQuality}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Psychological Safety</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.culturalInsights.psychologicalSafety}%</div>
            <div className="flex items-center space-x-2">
              <Progress value={analytics.culturalInsights.psychologicalSafety} className="flex-1" />
              <Badge variant={analytics.culturalInsights.psychologicalSafety > 80 ? "default" : "destructive"}>
                {analytics.culturalInsights.psychologicalSafety > 80 ? "High" : "Needs Attention"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Retention Risk</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.predictiveInsights.retentionRisk}%</div>
            <div className="flex items-center space-x-2">
              <Progress value={analytics.predictiveInsights.retentionRisk} className="flex-1" />
              <Badge variant={analytics.predictiveInsights.retentionRisk > 60 ? "destructive" : "default"}>
                {analytics.predictiveInsights.retentionRisk > 60 ? "High Risk" : "Low Risk"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement Forecast</CardTitle>
            {analytics.predictiveInsights.engagementForecast === 'improving' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : analytics.predictiveInsights.engagementForecast === 'declining' ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{analytics.predictiveInsights.engagementForecast}</div>
            <p className="text-xs text-muted-foreground">
              Based on recent trends
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Intervention Alert */}
      {analytics.predictiveInsights.interventionNeeded && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Intervention Recommended:</strong> {analytics.predictiveInsights.recommendedActions.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Emotional Journey */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Emotional Journey</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.emotionalInsights.emotionalJourney}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'avgScore' ? `${value}%` : value,
                    name === 'avgScore' ? 'Sentiment Score' : 'Tone'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgScore" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Dominant Emotional Tones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Emotional Tones</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.emotionalInsights.dominantTones}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tone, percentage }) => `${tone} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.emotionalInsights.dominantTones.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trust Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Trust & Culture Indicators</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.culturalInsights.trustIndicators.map((indicator, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{indicator.indicator}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant={indicator.trend === 'improving' ? 'default' : 'secondary'}>
                      {indicator.trend}
                    </Badge>
                    <span className="text-sm font-bold">{indicator.score}%</span>
                  </div>
                </div>
                <Progress value={indicator.score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      {analytics.predictiveInsights.recommendedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <span>Recommended Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.predictiveInsights.recommendedActions.map((action, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Target className="h-4 w-4 mt-1 text-muted-foreground" />
                  <span className="text-sm">{action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
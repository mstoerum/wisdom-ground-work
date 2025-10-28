import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  MessageSquare,
  Target,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { ParticipationMetrics, SentimentMetrics, ThemeInsight } from "@/hooks/useAnalytics";

interface ExecutiveDashboardProps {
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

interface TrafficLightStatus {
  status: 'green' | 'yellow' | 'red';
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'up' | 'down' | 'neutral';
}

export const ExecutiveDashboard = ({ 
  participation, 
  sentiment, 
  themes, 
  urgency,
  previousPeriod 
}: ExecutiveDashboardProps) => {
  
  // Calculate traffic light status for key metrics
  const getTrafficLightStatus = (): TrafficLightStatus[] => {
    if (!participation || !sentiment) return [];

    const completionRate = participation.completionRate;
    const avgSentiment = sentiment.avgScore;
    const urgentFlags = urgency.filter(u => !u.resolved_at).length;
    const totalResponses = participation.completed;

    return [
      {
        status: completionRate >= 80 ? 'green' : completionRate >= 60 ? 'yellow' : 'red',
        label: 'Participation Rate',
        value: `${completionRate.toFixed(1)}%`,
        change: previousPeriod ? completionRate - previousPeriod.participation.completionRate : undefined,
        changeType: previousPeriod ? 
          (completionRate > previousPeriod.participation.completionRate ? 'up' : 
           completionRate < previousPeriod.participation.completionRate ? 'down' : 'neutral') : undefined
      },
      {
        status: avgSentiment >= 70 ? 'green' : avgSentiment >= 50 ? 'yellow' : 'red',
        label: 'Employee Sentiment',
        value: avgSentiment.toFixed(1),
        change: previousPeriod ? avgSentiment - previousPeriod.sentiment.avgScore : undefined,
        changeType: previousPeriod ? 
          (avgSentiment > previousPeriod.sentiment.avgScore ? 'up' : 
           avgSentiment < previousPeriod.sentiment.avgScore ? 'down' : 'neutral') : undefined
      },
      {
        status: urgentFlags === 0 ? 'green' : urgentFlags <= 3 ? 'yellow' : 'red',
        label: 'Urgent Issues',
        value: urgentFlags,
        change: undefined
      },
      {
        status: totalResponses >= 50 ? 'green' : totalResponses >= 20 ? 'yellow' : 'red',
        label: 'Response Volume',
        value: totalResponses,
        change: undefined
      }
    ];
  };

  // Get top 3 concerns and wins
  const getTopConcerns = (): { theme: string; sentiment: number; urgent: number }[] => {
    return themes
      .filter(t => t.avgSentiment < 50 || t.urgencyCount > 0)
      .sort((a, b) => (a.urgencyCount * 2 + (50 - a.avgSentiment)) - (b.urgencyCount * 2 + (50 - b.avgSentiment)))
      .slice(0, 3)
      .map(t => ({
        theme: t.name,
        sentiment: t.avgSentiment,
        urgent: t.urgencyCount
      }));
  };

  const getTopWins = (): { theme: string; sentiment: number; responses: number }[] => {
    return themes
      .filter(t => t.avgSentiment >= 70 && t.urgencyCount === 0)
      .sort((a, b) => b.avgSentiment - a.avgSentiment)
      .slice(0, 3)
      .map(t => ({
        theme: t.name,
        sentiment: t.avgSentiment,
        responses: t.responseCount
      }));
  };

  const trafficLights = getTrafficLightStatus();
  const topConcerns = getTopConcerns();
  const topWins = getTopWins();

  const getStatusColor = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
    }
  };

  const getStatusIcon = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'yellow': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'red': return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  };

  const getChangeIcon = (changeType?: 'up' | 'down' | 'neutral') => {
    switch (changeType) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'neutral': return <Minus className="h-4 w-4 text-gray-600" />;
      default: return null;
    }
  };

  if (!participation || !sentiment) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Loading Executive Dashboard</h3>
        <p className="text-muted-foreground">Preparing your executive overview...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Traffic Light System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Executive Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trafficLights.map((light, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 rounded-lg border">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(light.status)}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground">{light.label}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{light.value}</span>
                    {light.change !== undefined && (
                      <div className="flex items-center gap-1">
                        {getChangeIcon(light.changeType)}
                        <span className={`text-sm ${
                          light.changeType === 'up' ? 'text-green-600' : 
                          light.changeType === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {Math.abs(light.change).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {getStatusIcon(light.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Concerns and Wins */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top 3 Concerns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Top 3 Concerns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topConcerns.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No major concerns identified</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topConcerns.map((concern, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                    <div>
                      <div className="font-medium text-red-900">{concern.theme}</div>
                      <div className="text-sm text-red-700">
                        Sentiment: {concern.sentiment.toFixed(1)} | 
                        Urgent: {concern.urgent}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                      Action
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Wins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Top 3 Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topWins.length === 0 ? (
              <div className="text-center py-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">More data needed to identify wins</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topWins.map((win, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div>
                      <div className="font-medium text-green-900">{win.theme}</div>
                      <div className="text-sm text-green-700">
                        Sentiment: {win.sentiment.toFixed(1)} | 
                        Responses: {win.responses}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Excellent
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Commitment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Action Commitment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {urgency.filter(u => !u.resolved_at).length}
              </div>
              <div className="text-sm text-blue-700">Pending Actions</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {urgency.filter(u => u.resolved_at).length}
              </div>
              <div className="text-sm text-green-700">Completed Actions</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">
                {themes.length}
              </div>
              <div className="text-sm text-gray-700">Active Themes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  ArrowRight
} from "lucide-react";
import { ThemePreviewCard } from "./ThemePreviewCard";
import { ThemeDrillDownPanel } from "./ThemeDrillDownPanel";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import type { ParticipationMetrics, SentimentMetrics, ThemeInsight } from "@/hooks/useAnalytics";
import type { QuickWin } from "@/lib/actionableIntelligence";

interface ExecutiveDashboardProps {
  participation?: ParticipationMetrics;
  sentiment?: SentimentMetrics;
  themes?: ThemeInsight[];
  urgency?: any[];
  quickWins?: QuickWin[];
  onNavigateToActions?: () => void;
  qualityMetrics?: {
    average_confidence_score: number;
  };
}

interface TrafficLightStatus {
  status: 'good' | 'warning' | 'critical';
  label: string;
  value: number | string;
  change?: number;
  unit?: string;
  confidence?: 'high' | 'medium' | 'low';
  sampleSize?: number;
}

export function ExecutiveDashboard({
  participation,
  sentiment,
  themes = [],
  urgency = [],
  quickWins = [],
  onNavigateToActions,
  qualityMetrics
}: ExecutiveDashboardProps) {
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  // Anonymization threshold check
  const hasMinimumData = (participation?.completed || 0) >= 10;

  // Get traffic light status for key metrics
  const getTrafficLightStatus = (): TrafficLightStatus[] => {
    const unresolvedUrgent = urgency.filter(u => !u.resolved_at).length;
    
    return [
      {
        status: (participation?.completionRate || 0) >= 70 ? 'good' : 
                (participation?.completionRate || 0) >= 50 ? 'warning' : 'critical',
        label: 'Participation Rate',
        value: participation?.completionRate || 0,
        change: 0, // Would need historical data
        unit: '%',
        confidence: (participation?.completed || 0) >= 50 ? 'high' : 
                   (participation?.completed || 0) >= 20 ? 'medium' : 'low',
        sampleSize: participation?.completed || 0
      },
      {
        status: (sentiment?.avgScore || 0) >= 60 ? 'good' : 
                (sentiment?.avgScore || 0) >= 40 ? 'warning' : 'critical',
        label: 'Employee Sentiment',
        value: `${Math.round(sentiment?.avgScore || 0)}`,
        change: sentiment?.moodImprovement || 0,
        unit: '/100',
        confidence: (participation?.completed || 0) >= 30 ? 'high' : 
                   (participation?.completed || 0) >= 15 ? 'medium' : 'low',
        sampleSize: participation?.completed || 0
      },
      {
        status: unresolvedUrgent === 0 ? 'good' : 
                unresolvedUrgent <= 3 ? 'warning' : 'critical',
        label: 'Urgent Issues',
        value: unresolvedUrgent,
        confidence: 'high',
        sampleSize: unresolvedUrgent
      },
      {
        status: (participation?.completed || 0) >= 20 ? 'good' : 
                (participation?.completed || 0) >= 10 ? 'warning' : 'critical',
        label: 'Response Volume',
        value: participation?.completed || 0,
        confidence: 'high',
        sampleSize: participation?.completed || 0
      }
    ];
  };

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-500';
      case 'warning': return 'text-yellow-600 dark:text-yellow-500';
      case 'critical': return 'text-red-600 dark:text-red-500';
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertCircle className="h-5 w-5" />;
      case 'critical': return <XCircle className="h-5 w-5" />;
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  // Get top 4 themes
  const topThemes = themes
    .sort((a, b) => b.responseCount - a.responseCount)
    .slice(0, 4);

  const topWins = quickWins
    .filter(w => w.impact === 'high')
    .slice(0, 3);

  const urgentIssues = urgency
    .filter(u => !u.resolved_at)
    .slice(0, 3);

  const trafficLights = getTrafficLightStatus();
  const selectedTheme = themes.find(t => t.id === selectedThemeId);

  // Loading state
  if (!participation || !sentiment) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Anonymization message
  if (!hasMinimumData) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Insufficient Data</h3>
            <p className="text-sm text-muted-foreground">
              At least 10 responses are required to display analytics and protect employee anonymity.
              <br />
              Current responses: {participation.completed}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Traffic Light System */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Executive Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {trafficLights.map((light, index) => (
              <div 
                key={index}
                className="p-4 rounded-xl border bg-card transition-all hover:shadow-md"
                role="status"
                aria-label={`${light.label}: ${light.value}${light.unit || ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`font-medium ${getStatusColor(light.status)}`}>
                    {getStatusIcon(light.status)}
                  </span>
                  <ConfidenceIndicator 
                    level={light.confidence || 'medium'}
                    sampleSize={light.sampleSize || 0}
                  />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{light.label}</p>
                  <p className="text-3xl font-bold tabular-nums">
                    {light.value}
                    <span className="text-lg text-muted-foreground ml-1">{light.unit}</span>
                  </p>
                  
                  {light.change !== undefined && light.change !== 0 && (
                    <div className={`flex items-center gap-1 text-sm ${
                      light.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {getChangeIcon(light.change)}
                      <span>{Math.abs(light.change)} {light.change > 0 ? 'improvement' : 'decline'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 4 Themes Preview (Small Multiples) */}
      {topThemes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Key Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {topThemes.map((theme) => (
                <ThemePreviewCard
                  key={theme.id}
                  theme={theme}
                  onClick={() => setSelectedThemeId(theme.id)}
                  qualityMetrics={qualityMetrics}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Wins & Urgent Issues */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Wins Preview */}
        {topWins.length > 0 && (
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Zap className="h-5 w-5" />
                Quick Wins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topWins.map((win, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-sm">{win.title}</h4>
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      {win.implementation_time}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{win.description}</p>
                </div>
              ))}
              
              {quickWins.length > 3 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full mt-2"
                  onClick={onNavigateToActions}
                >
                  View All {quickWins.length} Quick Wins
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Urgent Items Preview */}
        {urgentIssues.length > 0 && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Urgent Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {urgentIssues.map((issue, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-sm line-clamp-1">
                      {issue.responses?.survey_themes?.name || 'Unknown Theme'}
                    </h4>
                    <Badge variant="destructive" className="text-xs">Critical</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {issue.reason || 'Requires immediate attention'}
                  </p>
                </div>
              ))}
              
              {urgency.filter(u => !u.resolved_at).length > 3 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full mt-2"
                  onClick={onNavigateToActions}
                >
                  View All {urgency.filter(u => !u.resolved_at).length} Urgent Issues
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Theme Drill-Down Panel */}
      {selectedTheme && (
        <ThemeDrillDownPanel
          theme={selectedTheme}
          open={selectedThemeId !== null}
          onClose={() => setSelectedThemeId(null)}
        />
      )}
    </div>
  );
}

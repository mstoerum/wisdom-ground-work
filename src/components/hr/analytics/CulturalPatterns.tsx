import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Users
} from "lucide-react";
import { CulturalMap } from "@/lib/culturalPatterns";

interface CulturalPatternsProps {
  culturalMap: CulturalMap | null;
  isLoading?: boolean;
}

export function CulturalPatterns({ culturalMap, isLoading }: CulturalPatternsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Mapping cultural patterns...</p>
        </CardContent>
      </Card>
    );
  }

  if (!culturalMap) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Cultural Data Available</h3>
          <p className="text-muted-foreground">
            Cultural patterns will appear here once conversation data is analyzed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getCultureScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = () => {
    switch (culturalMap.cultural_evolution.trend) {
      case 'urgent':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Users className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Culture Score */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Overall Culture Score
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Based on conversation patterns and sentiment
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getCultureScoreColor(culturalMap.overall_culture_score)}`}>
                {culturalMap.overall_culture_score}/100
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {getTrendIcon()}
            <div>
              <p className="font-medium capitalize">{culturalMap.cultural_evolution.trend}</p>
              <p className="text-sm text-muted-foreground">
                {culturalMap.cultural_evolution.indicators.join(' • ')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cultural Strengths */}
      {culturalMap.cultural_strengths.length > 0 && (
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Cultural Strengths ({culturalMap.cultural_strengths.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {culturalMap.cultural_strengths.map((strength) => (
                <div 
                  key={strength.id}
                  className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{strength.strength_name}</h4>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {strength.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{strength.description}</p>
                  <div className="text-xs text-muted-foreground">
                    {strength.frequency} mentions
                    {strength.protective_factor && ' • Protective factor'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cultural Risks */}
      {culturalMap.cultural_risks.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Cultural Risks ({culturalMap.cultural_risks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {culturalMap.cultural_risks.map((risk) => (
                <div 
                  key={risk.id}
                  className={`p-4 rounded-lg border ${
                    risk.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                    risk.severity === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' :
                    'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{risk.risk_name}</h4>
                    <Badge 
                      variant={risk.severity === 'critical' ? 'destructive' : 'outline'}
                    >
                      {risk.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                  {risk.affected_groups.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {risk.affected_groups.map((group, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {group}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mb-2">
                    {risk.frequency} mentions
                  </div>
                  {risk.recommended_actions.length > 0 && (
                    <div className="mt-2 p-2 rounded bg-background border">
                      <p className="text-xs font-medium mb-1">Recommended Actions:</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {risk.recommended_actions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group Profiles */}
      {culturalMap.group_profiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Group Culture Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {culturalMap.group_profiles.map((profile) => (
                <div key={profile.group_name} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-lg">{profile.group_name}</h4>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        profile.overall_sentiment >= 70 ? 'text-green-600' :
                        profile.overall_sentiment >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {profile.overall_sentiment}/100
                      </div>
                      <p className="text-xs text-muted-foreground">Sentiment</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div>
                      <p className="text-xs font-medium mb-1">Strengths:</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.cultural_strengths.slice(0, 3).map((s) => (
                          <Badge key={s.id} variant="outline" className="text-xs bg-green-50">
                            {s.strength_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1">Risks:</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.cultural_risks.slice(0, 3).map((r) => (
                          <Badge key={r.id} variant="outline" className="text-xs bg-red-50">
                            {r.risk_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {profile.comparison_to_average.sentiment_diff > 0 ? '+' : ''}
                    {profile.comparison_to_average.sentiment_diff} vs average sentiment
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

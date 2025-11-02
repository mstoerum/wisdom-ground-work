import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  AlertTriangle,
  Lightbulb,
  Zap,
  TrendingUp,
  Loader2
} from "lucide-react";
import { RootCauseAnalysis } from "./RootCauseAnalysis";
import { InterventionRecommendations } from "./InterventionRecommendations";
import { QuickWins } from "./QuickWins";
import { ImpactPrediction } from "./ImpactPrediction";
import {
  RootCause,
  InterventionRecommendation,
  QuickWin,
  ImpactPrediction as ImpactPredictionType,
} from "@/lib/actionableIntelligence";

interface ActionableIntelligenceCenterProps {
  rootCauses: RootCause[];
  interventions: InterventionRecommendation[];
  quickWins: QuickWin[];
  impactPredictions: ImpactPredictionType[];
  isLoading?: boolean;
}

export function ActionableIntelligenceCenter({
  rootCauses,
  interventions,
  quickWins,
  impactPredictions,
  isLoading,
}: ActionableIntelligenceCenterProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Analyzing actionable intelligence...</p>
        </CardContent>
      </Card>
    );
  }

  const criticalInterventions = interventions.filter(i => i.priority === 'critical').length;
  const highImpactQuickWins = quickWins.filter(qw => qw.impact === 'high').length;
  const totalPotentialImprovement = impactPredictions.reduce(
    (sum, p) => sum + p.improvement, 
    0
  );

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Target className="h-5 w-5" />
            Actionable Intelligence Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Transform insights into action. Root cause analysis, intervention recommendations, 
            quick wins, and impact predictions to help you improve workplace satisfaction.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">Root Causes</span>
              </div>
              <div className="text-2xl font-bold">{rootCauses.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {rootCauses.reduce((sum, c) => sum + c.affected_employees, 0)} employees affected
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Interventions</span>
              </div>
              <div className="text-2xl font-bold">{interventions.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {criticalInterventions} critical priority
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Quick Wins</span>
              </div>
              <div className="text-2xl font-bold">{quickWins.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {highImpactQuickWins} high impact
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Potential Impact</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                +{Math.round(totalPotentialImprovement / impactPredictions.length || 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                avg sentiment improvement
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="root-causes" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Root Causes
            {rootCauses.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {rootCauses.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="interventions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Interventions
            {criticalInterventions > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {criticalInterventions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="quick-wins" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Quick Wins
            {quickWins.length > 0 && (
              <Badge variant="outline" className="ml-1 text-xs bg-green-50 text-green-700">
                {quickWins.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Wins First */}
          {quickWins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  Start Here: Quick Wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {quickWins.slice(0, 4).map((qw) => (
                    <div key={qw.id} className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{qw.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {qw.implementation_time}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{qw.description}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                          {qw.impact} impact
                        </Badge>
                        <span className="text-muted-foreground">{qw.affected_theme}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {quickWins.length > 4 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setActiveTab("quick-wins")}
                  >
                    View All {quickWins.length} Quick Wins
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Critical Interventions */}
          {criticalInterventions > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Priority Interventions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {interventions
                    .filter(i => i.priority === 'critical')
                    .slice(0, 3)
                    .map((intervention) => (
                      <div key={intervention.id} className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm">{intervention.title}</h4>
                          <Badge variant="destructive" className="text-xs">Critical</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{intervention.description}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-green-600 font-medium">
                            +{intervention.estimated_impact} improvement
                          </span>
                          <span className="text-muted-foreground">{intervention.timeline}</span>
                        </div>
                      </div>
                    ))}
                </div>
                {criticalInterventions > 3 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setActiveTab("interventions")}
                  >
                    View All {interventions.length} Interventions
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Impact Predictions Summary */}
          {impactPredictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Potential Impact Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {impactPredictions
                    .sort((a, b) => b.improvement - a.improvement)
                    .slice(0, 3)
                    .map((prediction) => (
                      <div key={prediction.theme_id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">{prediction.theme_name}</h4>
                          <span className="text-sm font-medium text-green-600">
                            +{prediction.improvement.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {prediction.current_sentiment.toFixed(1)} → {prediction.predicted_sentiment.toFixed(1)}
                          </span>
                          <span>{prediction.confidence}% confidence</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Root Causes Tab */}
        <TabsContent value="root-causes">
          <RootCauseAnalysis rootCauses={rootCauses} />
        </TabsContent>

        {/* Interventions Tab */}
        <TabsContent value="interventions">
          <InterventionRecommendations interventions={interventions} />
        </TabsContent>

        {/* Quick Wins Tab */}
        <TabsContent value="quick-wins">
          <QuickWins quickWins={quickWins} />
        </TabsContent>
      </Tabs>

      {/* Impact Predictions - Always Visible */}
      {impactPredictions.length > 0 && (
        <div>
          <ImpactPrediction predictions={impactPredictions} />
        </div>
      )}
    </div>
  );
}

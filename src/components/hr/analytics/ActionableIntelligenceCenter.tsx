import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [expandedSections, setExpandedSections] = useState({
    rootCauses: false,
    interventions: false
  });

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
      {/* Quick Wins - Always Expanded (Top Priority) */}
      {quickWins.length > 0 && (
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Zap className="h-5 w-5" />
              Quick Wins (Start Here)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuickWins quickWins={quickWins} />
          </CardContent>
        </Card>
      )}

      {/* Urgent Issues - Always Expanded (If Any) */}
      {criticalInterventions > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Urgent Issues ({criticalInterventions})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {interventions
                .filter(i => i.priority === 'critical')
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
          </CardContent>
        </Card>
      )}

      {/* Root Cause Analysis - Collapsible */}
      {rootCauses.length > 0 && (
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setExpandedSections(prev => ({ ...prev, rootCauses: !prev.rootCauses }))}>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Root Cause Analysis ({rootCauses.length})
              </span>
              <Button variant="ghost" size="sm">
                {expandedSections.rootCauses ? 'Collapse' : 'Expand'}
              </Button>
            </CardTitle>
          </CardHeader>
          {expandedSections.rootCauses && (
            <CardContent>
              <RootCauseAnalysis rootCauses={rootCauses} />
            </CardContent>
          )}
        </Card>
      )}

      {/* Intervention Recommendations - Collapsible */}
      {interventions.length > 0 && (
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setExpandedSections(prev => ({ ...prev, interventions: !prev.interventions }))}>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                Intervention Recommendations ({interventions.length})
              </span>
              <Button variant="ghost" size="sm">
                {expandedSections.interventions ? 'Collapse' : 'Expand'}
              </Button>
            </CardTitle>
          </CardHeader>
          {expandedSections.interventions && (
            <CardContent>
              <InterventionRecommendations interventions={interventions} />
            </CardContent>
          )}
        </Card>
      )}

      {/* Impact Predictions - Always Visible */}
      {impactPredictions.length > 0 && (
        <ImpactPrediction predictions={impactPredictions} />
      )}

      {/* Narrative Summary - Always Visible (If Available) */}
      {/* This would come from props if available */}
    </div>
  );
}

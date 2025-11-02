import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  Target,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { InterventionRecommendation } from "@/lib/actionableIntelligence";
import { useNavigate } from "react-router-dom";

interface InterventionRecommendationsProps {
  interventions: InterventionRecommendation[];
  isLoading?: boolean;
}

export function InterventionRecommendations({ 
  interventions, 
  isLoading 
}: InterventionRecommendationsProps) {
  const navigate = useNavigate();
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Generating recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  if (interventions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Interventions Needed</h3>
          <p className="text-muted-foreground">
            All themes are performing well. No specific interventions recommended at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredInterventions = selectedPriority === "all"
    ? interventions
    : interventions.filter(i => i.priority === selectedPriority);

  const priorityColors = {
    critical: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/20 dark:text-red-400",
    high: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/20 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/20 dark:text-yellow-400",
    low: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/20 dark:text-blue-400",
  };

  const effortColors = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-red-600",
  };

  const handleCreateCommitment = (intervention: InterventionRecommendation) => {
    // Navigate to commitments page with pre-filled data
    navigate("/hr/commitments", {
      state: {
        actionDescription: intervention.title,
        suggestedSteps: intervention.action_steps,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Intervention Recommendations
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredInterventions.length} recommendation{filteredInterventions.length !== 1 ? 's' : ''} 
                {selectedPriority !== "all" && ` (${selectedPriority} priority)`}
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-1.5 text-sm border rounded-md bg-background"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{interventions.length}</div>
              <div className="text-xs text-muted-foreground">Total Recommendations</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-red-600">
                {interventions.filter(i => i.priority === 'critical').length}
              </div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">
                {interventions.filter(i => i.quick_win).length}
              </div>
              <div className="text-xs text-muted-foreground">Quick Wins</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">
                {Math.round(interventions.reduce((sum, i) => sum + i.estimated_impact, 0) / interventions.length)}
              </div>
              <div className="text-xs text-muted-foreground">Avg Impact</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interventions List */}
      <div className="space-y-4">
        {filteredInterventions.map((intervention) => (
          <Card 
            key={intervention.id}
            className={`border-l-4 ${
              intervention.priority === 'critical' ? 'border-red-500' :
              intervention.priority === 'high' ? 'border-orange-500' :
              intervention.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{intervention.title}</CardTitle>
                    {intervention.quick_win && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Quick Win
                      </Badge>
                    )}
                    <Badge className={priorityColors[intervention.priority]}>
                      {intervention.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{intervention.description}</p>
                  
                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium">+{intervention.estimated_impact} sentiment improvement</span>
                    </div>
                    <div className={`flex items-center gap-1 ${effortColors[intervention.effort_level]}`}>
                      <Clock className="h-4 w-4" />
                      <span>{intervention.effort_level} effort</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{intervention.timeline}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rationale */}
              <div className="p-3 rounded-lg bg-muted">
                <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Why This Matters
                </h5>
                <p className="text-sm">{intervention.rationale}</p>
              </div>

              {/* Root Causes */}
              {intervention.root_causes.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Addresses Root Causes
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {intervention.root_causes.map((cause, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {cause}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Steps */}
              <div>
                <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Action Steps
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {intervention.action_steps.map((step, idx) => (
                    <li key={idx} className="text-muted-foreground">{step}</li>
                  ))}
                </ol>
              </div>

              {/* Success Metrics */}
              <div>
                <h5 className="text-sm font-semibold mb-2">Success Metrics</h5>
                <div className="flex flex-wrap gap-2">
                  {intervention.success_metrics.map((metric, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {metric}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => handleCreateCommitment(intervention)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Create Action Plan
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

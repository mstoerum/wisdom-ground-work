import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Target
} from "lucide-react";
import { QuickWin } from "@/lib/actionableIntelligence";
import { useNavigate } from "react-router-dom";

interface QuickWinsProps {
  quickWins: QuickWin[];
  isLoading?: boolean;
}

export function QuickWins({ quickWins, isLoading }: QuickWinsProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Identifying quick wins...</p>
        </CardContent>
      </Card>
    );
  }

  if (quickWins.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Quick Wins Available</h3>
          <p className="text-muted-foreground">
            Quick wins are low-effort, high-impact actions. None identified at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCreateCommitment = (quickWin: QuickWin) => {
    navigate("/hr/commitments", {
      state: {
        actionDescription: quickWin.title,
        suggestedSteps: [quickWin.description],
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-green-200 dark:border-green-900 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Zap className="h-5 w-5" />
            Quick Wins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            These are low-effort, high-impact actions you can implement quickly to improve employee satisfaction.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-background border">
              <div className="text-2xl font-bold text-green-600">{quickWins.length}</div>
              <div className="text-xs text-muted-foreground">Quick Wins Available</div>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <div className="text-2xl font-bold">
                {quickWins.filter(qw => qw.impact === 'high').length}
              </div>
              <div className="text-xs text-muted-foreground">High Impact</div>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <div className="text-2xl font-bold">
                {quickWins.filter(qw => qw.effort === 'very_low').length}
              </div>
              <div className="text-xs text-muted-foreground">Very Low Effort</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Wins Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {quickWins.map((quickWin) => (
          <Card 
            key={quickWin.id}
            className="border-l-4 border-green-500 hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-base">{quickWin.title}</CardTitle>
                    <Badge 
                      variant="outline" 
                      className={`${
                        quickWin.impact === 'high' 
                          ? 'bg-green-50 text-green-700 border-green-300' 
                          : 'bg-blue-50 text-blue-700 border-blue-300'
                      }`}
                    >
                      {quickWin.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{quickWin.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700">{quickWin.implementation_time}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={
                    quickWin.effort === 'very_low' 
                      ? 'border-green-300 text-green-700' 
                      : 'border-blue-300 text-blue-700'
                  }
                >
                  {quickWin.effort === 'very_low' ? 'Very Low' : 'Low'} Effort
                </Badge>
              </div>

              {/* Affected Theme */}
              <div>
                <span className="text-xs text-muted-foreground">Affects: </span>
                <Badge variant="outline" className="text-xs ml-1">
                  {quickWin.affected_theme}
                </Badge>
              </div>

              {/* Evidence */}
              {quickWin.evidence.length > 0 && (
                <div className="p-2 rounded bg-muted">
                  <p className="text-xs font-semibold mb-1">Based on:</p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                    {quickWin.evidence.slice(0, 2).map((evidence, idx) => (
                      <li key={idx}>{evidence}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Button */}
              <Button 
                onClick={() => handleCreateCommitment(quickWin)}
                size="sm" 
                className="w-full mt-2"
                variant="outline"
              >
                <Target className="h-4 w-4 mr-2" />
                Create Action Plan
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

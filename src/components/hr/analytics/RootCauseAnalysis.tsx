import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  TrendingDown,
  Users,
  Quote,
  BarChart3,
  Loader2
} from "lucide-react";
import { RootCause } from "@/lib/actionableIntelligence";

interface RootCauseAnalysisProps {
  rootCauses: RootCause[];
  isLoading?: boolean;
}

export function RootCauseAnalysis({ rootCauses, isLoading }: RootCauseAnalysisProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Analyzing root causes...</p>
        </CardContent>
      </Card>
    );
  }

  if (rootCauses.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Root Causes Identified</h3>
          <p className="text-muted-foreground">
            All themes are performing well. No critical root causes found.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by theme
  const causesByTheme = new Map<string, RootCause[]>();
  rootCauses.forEach(cause => {
    if (!causesByTheme.has(cause.theme_name)) {
      causesByTheme.set(cause.theme_name, []);
    }
    causesByTheme.get(cause.theme_name)!.push(cause);
  });

  // Sort themes by highest impact cause
  const sortedThemes = Array.from(causesByTheme.entries()).sort((a, b) => {
    const maxA = Math.max(...a[1].map(c => c.impact_score));
    const maxB = Math.max(...b[1].map(c => c.impact_score));
    return maxB - maxA;
  });

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-orange-200 dark:border-orange-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Root Cause Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Identified {rootCauses.length} root causes across {causesByTheme.size} themes 
            affecting {new Set(rootCauses.flatMap(c => c.representative_quotes)).size} employees.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-orange-600">{rootCauses.length}</div>
              <div className="text-xs text-muted-foreground">Root Causes</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">
                {Math.round(rootCauses.reduce((sum, c) => sum + c.impact_score, 0) / rootCauses.length)}
              </div>
              <div className="text-xs text-muted-foreground">Avg Impact Score</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">
                {rootCauses.reduce((sum, c) => sum + c.affected_employees, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Affected Employees</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Root Causes by Theme */}
      <div className="space-y-6">
        {sortedThemes.map(([themeName, causes]) => {
          const maxImpact = Math.max(...causes.map(c => c.impact_score));
          
          return (
            <Card key={themeName} className="border-l-4 border-orange-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-2">{themeName}</CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        {causes.length} root cause{causes.length > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {causes.reduce((sum, c) => sum + c.affected_employees, 0)} affected
                      </span>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-sm">
                    Impact: {Math.round(maxImpact)}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {causes
                  .sort((a, b) => b.impact_score - a.impact_score)
                  .map((cause, index) => (
                    <div 
                      key={cause.id}
                      className="p-4 rounded-lg border bg-orange-50 dark:bg-orange-950/20 space-y-3"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <h4 className="font-semibold">Root Cause #{index + 1}: {cause.cause}</h4>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span>Frequency: {cause.frequency} mentions</span>
                            <span>Impact Score: {Math.round(cause.impact_score)}/100</span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {cause.affected_employees} employees
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Impact Score Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">Impact Score</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(cause.impact_score)}/100
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              cause.impact_score >= 70 ? 'bg-red-600' :
                              cause.impact_score >= 50 ? 'bg-orange-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${cause.impact_score}%` }}
                          />
                        </div>
                      </div>

                      {/* Evidence */}
                      {cause.evidence.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Quote className="h-4 w-4" />
                            Evidence
                          </h5>
                          <div className="space-y-2">
                            {cause.evidence.slice(0, 3).map((evidence, idx) => (
                              <div 
                                key={idx}
                                className="text-sm italic text-muted-foreground p-2 bg-background rounded border"
                              >
                                "{evidence}"
                              </div>
                            ))}
                            {cause.evidence.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                ... and {cause.evidence.length - 3} more pieces of evidence
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

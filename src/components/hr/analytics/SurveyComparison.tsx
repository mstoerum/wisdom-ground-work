import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSurveyComparison } from "@/hooks/useSurveyComparison";
import { cn } from "@/lib/utils";

interface Survey {
  id: string;
  title: string;
}

interface SurveyComparisonProps {
  surveys: Survey[];
  currentSurveyId?: string;
}

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-600" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function ChangeDisplay({ change, trend }: { change?: number; trend?: 'up' | 'down' | 'stable' }) {
  if (change === undefined) return null;
  
  const formatted = change > 0 ? `+${Math.round(change)}` : Math.round(change).toString();
  
  return (
    <div className={cn(
      "flex items-center gap-1 text-sm font-medium",
      trend === 'up' && "text-emerald-600",
      trend === 'down' && "text-destructive",
      trend === 'stable' && "text-muted-foreground"
    )}>
      <TrendIcon trend={trend} />
      {formatted}
    </div>
  );
}

export function SurveyComparison({ surveys, currentSurveyId }: SurveyComparisonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    currentSurveyId ? [currentSurveyId] : []
  );

  const { surveys: comparisonData, metrics, isLoading } = useSurveyComparison(selectedIds);

  const addSurvey = (id: string) => {
    if (!selectedIds.includes(id) && selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeSurvey = (id: string) => {
    setSelectedIds(selectedIds.filter(s => s !== id));
  };

  const availableSurveys = surveys.filter(s => !selectedIds.includes(s.id));

  if (surveys.length < 2) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Survey Comparison</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Create at least 2 surveys to compare metrics and track organizational improvement over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Survey Comparison
        </CardTitle>
        <CardDescription>
          Compare metrics across surveys to track improvement over time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Survey Selection */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Comparing:</span>
          {selectedIds.map(id => {
            const survey = surveys.find(s => s.id === id);
            return (
              <Badge 
                key={id} 
                variant="secondary" 
                className="gap-1 pr-1"
              >
                {survey?.title || 'Unknown'}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-destructive/20"
                  onClick={() => removeSurvey(id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
          
          {availableSurveys.length > 0 && selectedIds.length < 4 && (
            <Select onValueChange={addSurvey}>
              <SelectTrigger className="w-[200px] h-8">
                <SelectValue placeholder="Add survey..." />
              </SelectTrigger>
              <SelectContent>
                {availableSurveys.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Comparison Table */}
        {selectedIds.length >= 2 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Metric</TableHead>
                  {comparisonData.map(survey => (
                    <TableHead key={survey.surveyId} className="text-center">
                      <span className="line-clamp-1">{survey.surveyTitle}</span>
                    </TableHead>
                  ))}
                  {selectedIds.length === 2 && (
                    <TableHead className="text-center w-[100px]">Change</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={selectedIds.length + 2} className="text-center py-8">
                      <div className="animate-pulse text-muted-foreground">
                        Loading comparison data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  metrics.map(metric => (
                    <TableRow key={metric.label}>
                      <TableCell className="font-medium">{metric.label}</TableCell>
                      {metric.values.map(v => (
                        <TableCell key={v.surveyId} className="text-center">
                          {v.formatted}
                        </TableCell>
                      ))}
                      {selectedIds.length === 2 && (
                        <TableCell className="text-center">
                          <ChangeDisplay change={metric.change} trend={metric.trend} />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Select at least 2 surveys to compare</p>
          </div>
        )}

        {selectedIds.length >= 2 && metrics.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <p>
              Tip: Compare surveys from different time periods to track organizational improvement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

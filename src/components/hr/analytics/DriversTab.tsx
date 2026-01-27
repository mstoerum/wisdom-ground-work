import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSemanticSignals, getDimensionLabel, type Dimension } from "@/hooks/useSemanticSignals";
import { DimensionRadar } from "./DimensionRadar";
import { SignalCard, SignalList } from "./SignalCard";
import { CrossPatterns } from "./CrossPatterns";
import { RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface DriversTabProps {
  surveyId: string;
}

const DIMENSION_ORDER: Dimension[] = [
  "expertise",
  "autonomy", 
  "justice",
  "social_connection",
  "social_status"
];

export const DriversTab = ({ surveyId }: DriversTabProps) => {
  const { data, isLoading, error, aggregate, isAggregating, refetch } = useSemanticSignals(surveyId);
  const [selectedDimension, setSelectedDimension] = useState<Dimension | "all">("all");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load driver insights</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "An error occurred"}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const hasSignals = data && data.signals.length > 0;
  const filteredSignals = selectedDimension === "all" 
    ? data?.signals || []
    : data?.signals.filter(s => s.dimension === selectedDimension) || [];

  // Separate positive and negative signals
  const positiveSignals = filteredSignals.filter(s => s.sentiment === "positive");
  const negativeSignals = filteredSignals.filter(s => s.sentiment === "negative");
  const neutralSignals = filteredSignals.filter(s => s.sentiment === "neutral" || s.sentiment === "mixed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Workplace Drivers</h2>
          <p className="text-sm text-muted-foreground">
            Research-backed analysis of employee satisfaction dimensions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data?.analyzedAt && (
            <span className="text-xs text-muted-foreground">
              Updated {formatDistanceToNow(new Date(data.analyzedAt), { addSuffix: true })}
            </span>
          )}
          <Button 
            onClick={() => aggregate()} 
            disabled={isAggregating}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isAggregating ? 'animate-spin' : ''}`} />
            {isAggregating ? "Analyzing..." : "Refresh Analysis"}
          </Button>
        </div>
      </div>

      {!hasSignals ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/30 rounded-lg border-2 border-dashed">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No driver signals yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            Semantic signals are extracted from employee satisfaction surveys. 
            Once employees start sharing feedback, you'll see insights across 5 research-backed dimensions.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {DIMENSION_ORDER.map(dim => (
              <span 
                key={dim}
                className="px-2 py-1 bg-muted rounded text-xs"
              >
                {getDimensionLabel(dim)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Main Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Radar Chart */}
            <DimensionRadar dimensions={data.dimensions} />
            
            {/* Cross Patterns */}
            <CrossPatterns 
              dimensions={data.dimensions} 
              signals={data.signals}
            />
          </div>

          {/* Signal Explorer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Signal Explorer</h3>
              <span className="text-sm text-muted-foreground">
                {data.totalVoices} total voices across {data.signals.length} patterns
              </span>
            </div>

            {/* Dimension Filter Tabs */}
            <Tabs value={selectedDimension} onValueChange={(v) => setSelectedDimension(v as Dimension | "all")}>
              <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="all" className="flex-1 min-w-[80px]">
                  All
                </TabsTrigger>
                {DIMENSION_ORDER.map(dim => {
                  const dimData = data.dimensions.find(d => d.dimension === dim);
                  const count = data.signals.filter(s => s.dimension === dim).length;
                  return (
                    <TabsTrigger 
                      key={dim} 
                      value={dim}
                      className="flex-1 min-w-[100px]"
                      disabled={count === 0}
                    >
                      {getDimensionLabel(dim)}
                      {count > 0 && (
                        <span className="ml-1 text-xs opacity-60">({count})</span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value={selectedDimension} className="mt-4">
                {/* Signal Categories */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Positive Signals */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium text-sm">Strengths ({positiveSignals.length})</span>
                    </div>
                    {positiveSignals.length > 0 ? (
                      <div className="space-y-2">
                        {positiveSignals.map(signal => (
                          <SignalCard 
                            key={signal.id} 
                            signal={signal}
                            showDimension={selectedDimension === "all"}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No positive signals
                      </p>
                    )}
                  </div>

                  {/* Negative Signals */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <TrendingDown className="w-4 h-4" />
                      <span className="font-medium text-sm">Frictions ({negativeSignals.length})</span>
                    </div>
                    {negativeSignals.length > 0 ? (
                      <div className="space-y-2">
                        {negativeSignals.map(signal => (
                          <SignalCard 
                            key={signal.id} 
                            signal={signal}
                            showDimension={selectedDimension === "all"}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No friction signals
                      </p>
                    )}
                  </div>

                  {/* Neutral/Mixed Signals */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Minus className="w-4 h-4" />
                      <span className="font-medium text-sm">Neutral/Mixed ({neutralSignals.length})</span>
                    </div>
                    {neutralSignals.length > 0 ? (
                      <div className="space-y-2">
                        {neutralSignals.map(signal => (
                          <SignalCard 
                            key={signal.id} 
                            signal={signal}
                            showDimension={selectedDimension === "all"}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No neutral signals
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
};

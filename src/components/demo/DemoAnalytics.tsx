import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HRLayout } from "@/components/hr/HRLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Analytics components
import { HybridInsightsView } from "@/components/hr/analytics/HybridInsightsView";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useNarrativeReports } from "@/hooks/useNarrativeReports";

// Demo survey ID - matches the seed-demo-data edge function
const DEMO_SURVEY_ID = "99e58381-8736-4641-a2d3-632c809dd29b";

interface DemoAnalyticsProps {
  onBackToMenu: () => void;
}

export const DemoAnalytics = ({ onBackToMenu }: DemoAnalyticsProps) => {
  const [isSeeding, setIsSeeding] = useState(false);
  const queryClient = useQueryClient();

  // Use real analytics hooks - they'll fetch from the database
  const { participation, sentiment, themes, isLoading: analyticsLoading } = useAnalytics({ surveyId: DEMO_SURVEY_ID });
  const { latestReport, isLoading: reportLoading, generateReport, isGenerating } = useNarrativeReports(DEMO_SURVEY_ID);

  // Check if we have demo data
  const { data: sessionCount } = useQuery({
    queryKey: ["demo-session-count", DEMO_SURVEY_ID],
    queryFn: async () => {
      const { count } = await supabase
        .from("conversation_sessions")
        .select("*", { count: "exact", head: true })
        .eq("survey_id", DEMO_SURVEY_ID);
      return count || 0;
    },
  });

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    toast.info("Generating demo data...", { description: "Creating 50+ realistic conversations with semantic patterns" });

    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-data");
      
      if (error) throw error;

      toast.success("Demo data generated!", {
        description: `Created ${data.sessions_created} sessions. Analytics pipeline running...`,
      });

      // Wait for analytics to process
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Invalidate all queries to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["narrative-reports"] });
      queryClient.invalidateQueries({ queryKey: ["theme-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["demo-session-count"] });

    } catch (error) {
      console.error("Seed error:", error);
      toast.error("Failed to generate demo data");
    } finally {
      setIsSeeding(false);
    }
  };

  const hasData = sessionCount && sessionCount > 0;

  return (
    <HRLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">Employee Pulse Analytics</h1>
                  <Badge variant="secondary">Demo</Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  {hasData 
                    ? `Nexus Technologies - ${participation?.completed || 0} employee conversations analyzed`
                    : "Generate demo data to see Spradley's semantic intelligence in action"
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSeedDemoData}
                  disabled={isSeeding}
                >
                  {isSeeding ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {hasData ? "Regenerate Data" : "Generate Demo Data"}
                </Button>
                <Button variant="ghost" size="sm" onClick={onBackToMenu}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>

            {/* Survey Selector */}
            <div className="flex flex-wrap gap-4">
              <Select value="demo-nexus-survey" disabled>
                <SelectTrigger className="w-[320px]">
                  <SelectValue>Post-Product Launch Pulse - Nexus Technologies</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo-nexus-survey">
                    Post-Product Launch Pulse - Nexus Technologies
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Analytics View - Uses real data from database */}
            <HybridInsightsView
              participation={participation}
              sentiment={sentiment}
              themes={themes}
              latestReport={latestReport}
              isReportLoading={reportLoading}
              isGenerating={isGenerating}
              onGenerateReport={() => generateReport({ surveyId: DEMO_SURVEY_ID })}
              surveyId={DEMO_SURVEY_ID}
              surveyTitle="Post-Product Launch Pulse"
              isLoading={analyticsLoading || isSeeding}
            />
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

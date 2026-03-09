import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HybridInsightsView } from "@/components/hr/analytics/HybridInsightsView";
import { Badge } from "@/components/ui/badge";
import { Share2, Shield } from "lucide-react";

const PublicAnalytics = () => {
  const { shareToken } = useParams<{ shareToken: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-analytics", shareToken],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-public-analytics", {
        body: { shareToken },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    enabled: !!shareToken,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Link Unavailable</h1>
          <p className="text-muted-foreground">
            This analytics link may have expired, been deactivated, or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading shared analytics...</p>
        </div>
      </div>
    );
  }

  const mappedThemes = (data?.themes || []).map((t: any) => ({
    id: t.themeId,
    name: t.themeName,
    responseCount: t.responseCount || 0,
    avgSentiment: t.healthIndex ?? 50,
    urgencyCount: 0,
    keySignals: { concerns: [], positives: [], other: [] },
  }));

  const mappedSentiment = data?.sentiment
    ? { ...data.sentiment, avgScore: data.sentiment.averageScore || 0, moodImprovement: 0 }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{data?.survey?.title || "Survey Analytics"}</h1>
              <Badge variant="secondary" className="gap-1">
                <Share2 className="h-3 w-3" />
                Shared View
              </Badge>
            </div>
          </div>

          {/* Analytics */}
          <HybridInsightsView
            participation={data?.participation || null}
            sentiment={mappedSentiment}
            themes={mappedThemes}
            surveyId={data?.survey?.id || null}
            surveyTitle={data?.survey?.title}
            isLoading={false}
          />
        </div>
      </div>
    </div>
  );
};

export default PublicAnalytics;

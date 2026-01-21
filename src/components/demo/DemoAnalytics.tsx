import { useState } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

// Analytics components
import { HybridInsightsView } from "@/components/hr/analytics/HybridInsightsView";

// Showcase data - curated UX Course Evaluation dataset
import {
  showcaseParticipation,
  showcaseSentiment,
  showcaseThemes,
  showcaseNarrativeReport,
  showcaseCourse,
} from "@/utils/uxCourseShowcaseData";

interface DemoAnalyticsProps {
  onBackToMenu: () => void;
}

export const DemoAnalytics = ({ onBackToMenu }: DemoAnalyticsProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    toast.info("Generating report... (Demo)", {
      description: "In a real survey, this would regenerate the AI analysis.",
    });
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <HRLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            {/* Header - Matches Analytics page */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">Course Evaluation Analytics</h1>
                  <Badge variant="secondary">Demo</Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  Comprehensive insights from {showcaseParticipation.completed} completed evaluations
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onBackToMenu}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Demo Menu
              </Button>
            </div>

            {/* Survey Selector - Matches Analytics page */}
            <div className="flex flex-wrap gap-4">
              <Select value="demo-ux-survey" disabled>
                <SelectTrigger className="w-[280px]">
                  <SelectValue>{showcaseCourse.surveyName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo-ux-survey">
                    {showcaseCourse.surveyName}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* HybridInsightsView - Same as Analytics page */}
            {/* Use real survey ID so theme analytics can fetch actual data */}
            <HybridInsightsView
              participation={showcaseParticipation}
              sentiment={showcaseSentiment}
              themes={showcaseThemes}
              latestReport={showcaseNarrativeReport as any}
              isReportLoading={false}
              isGenerating={isGenerating}
              onGenerateReport={handleGenerateReport}
              surveyId="99e58381-8736-4641-a2d3-632c809dd29b"
              surveyTitle={showcaseCourse.surveyName}
              isLoading={false}
            />
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

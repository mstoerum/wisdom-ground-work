import { useState } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, AlertTriangle, MessageSquare, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Analytics components
import { HybridInsightsView } from "@/components/hr/analytics/HybridInsightsView";
import { ActionableIntelligenceCenter } from "@/components/hr/analytics/ActionableIntelligenceCenter";
import { EmployeeVoiceGallery } from "@/components/hr/analytics/EmployeeVoiceGallery";
import { EnhancedThemeAnalysis } from "@/components/hr/analytics/EnhancedThemeAnalysis";
import { ConversationQualityDashboard } from "@/components/hr/analytics/ConversationQualityDashboard";
import { ExportAuditLog } from "@/components/hr/analytics/ExportAuditLog";

// Demo components
import { DemoStoryBanner } from "./DemoStoryBanner";

// Showcase data - curated UX Course Evaluation dataset
import {
  showcaseParticipation,
  showcaseSentiment,
  showcaseThemes,
  showcaseQualityMetrics,
  showcaseQualityInsights,
  showcaseEnhancedThemes,
  showcaseQuotes,
  showcaseRootCauses,
  showcaseInterventions,
  showcaseQuickWins,
  showcaseImpactPredictions,
  showcaseNarrativeReport,
  showcaseCourse,
} from "@/utils/uxCourseShowcaseData";

interface DemoAnalyticsProps {
  onBackToMenu: () => void;
}

export const DemoAnalytics = ({ onBackToMenu }: DemoAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState("insights");
  const [isGenerating, setIsGenerating] = useState(false);

  // Count unresolved urgent flags from themes
  const unresolvedUrgentCount = showcaseThemes.reduce((sum, t) => sum + t.urgencyCount, 0);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    toast.info("Generating report... (Demo)", {
      description: "In a real survey, this would regenerate the AI analysis.",
    });
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <HRLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 overflow-x-hidden">
        {/* Demo Story Banner */}
        <div className="mb-6">
          <DemoStoryBanner onBackToMenu={onBackToMenu} />
        </div>

        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
          <div className="space-y-6">
            {/* Main Tabs - Aligned with real Analytics page */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Actions
                  {unresolvedUrgentCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {unresolvedUrgentCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="explore" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Explore
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Export
                </TabsTrigger>
              </TabsList>

              {/* Insights Tab - Primary view with metrics + narrative */}
              <TabsContent value="insights" className="space-y-6">
                <HybridInsightsView
                  participation={showcaseParticipation}
                  sentiment={showcaseSentiment}
                  themes={showcaseThemes}
                  latestReport={showcaseNarrativeReport as any}
                  isReportLoading={false}
                  isGenerating={isGenerating}
                  onGenerateReport={handleGenerateReport}
                  surveyId="demo-ux-survey"
                  surveyTitle={showcaseCourse.surveyName}
                  isLoading={false}
                />
              </TabsContent>

              {/* Actions Tab - Urgent issues + recommendations */}
              <TabsContent value="actions" className="space-y-6">
                <ActionableIntelligenceCenter
                  rootCauses={showcaseRootCauses}
                  interventions={showcaseInterventions}
                  quickWins={showcaseQuickWins}
                  impactPredictions={showcaseImpactPredictions}
                  isLoading={false}
                />
              </TabsContent>

              {/* Explore Tab - Deep dive into data */}
              <TabsContent value="explore" className="space-y-6">
                <Tabs defaultValue="themes" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="themes">Themes</TabsTrigger>
                    <TabsTrigger value="voices">Employee Voices</TabsTrigger>
                    <TabsTrigger value="quality">Data Quality</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="themes">
                    <EnhancedThemeAnalysis 
                      themes={showcaseEnhancedThemes} 
                      isLoading={false} 
                    />
                  </TabsContent>
                  
                  <TabsContent value="voices">
                    <EmployeeVoiceGallery 
                      quotes={showcaseQuotes} 
                      isLoading={false} 
                    />
                  </TabsContent>
                  
                  <TabsContent value="quality">
                    <ConversationQualityDashboard 
                      qualityMetrics={showcaseQualityMetrics} 
                      qualityInsights={showcaseQualityInsights} 
                      isLoading={false} 
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Export Tab - Reports and downloads */}
              <TabsContent value="export" className="space-y-6">
                <ExportAuditLog />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </HRLayout>
  );
};

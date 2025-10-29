import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, Info, Eye, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PreviewModeProvider } from "@/contexts/PreviewModeContext";
import { EmployeeSurveyFlow } from "@/components/employee/EmployeeSurveyFlow";
import { Loader2 } from "lucide-react";

interface CompleteEmployeeExperiencePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyData: {
    title: string;
    first_message?: string;
    themes?: string[];
    consent_config?: {
      anonymization_level?: string;
      data_retention_days?: number;
      consent_message?: string;
    };
  };
  surveyId?: string;
}

/**
 * Complete Employee Experience Preview
 * Uses the REAL employee survey flow components in preview mode
 * Following Don Norman's UX principle: "Test with the real thing, not a simulation"
 */
export const CompleteEmployeeExperiencePreview = ({
  open,
  onOpenChange,
  surveyData,
  surveyId,
}: CompleteEmployeeExperiencePreviewProps) => {
  const [loadedSurveyData, setLoadedSurveyData] = useState<any>(null);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);

  // Fetch full survey data if surveyId is provided
  const { data: fullSurveyData, isLoading: isLoadingQuery } = useQuery({
    queryKey: ["survey-preview", surveyId],
    queryFn: async () => {
      if (!surveyId) return null;
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", surveyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!surveyId && open,
  });

  // Use full survey data if available, otherwise use passed surveyData
  useEffect(() => {
    if (fullSurveyData) {
      setLoadedSurveyData(fullSurveyData);
      setIsLoadingSurvey(false);
    } else if (open && !surveyId) {
      // If no surveyId, construct survey data from passed props
      setLoadedSurveyData({
        id: "preview-survey",
        ...surveyData,
      });
      setIsLoadingSurvey(false);
    }
  }, [fullSurveyData, surveyData, surveyId, open]);

  const handleComplete = () => {
    // Preview completed, close after a brief delay
    setTimeout(() => {
      onOpenChange(false);
    }, 1500);
  };

  const handleExit = () => {
    onOpenChange(false);
  };

  if (isLoadingQuery || isLoadingSurvey || !loadedSurveyData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-8 pt-8 pb-6 border-b bg-muted/30">
          <div className="flex items-start justify-between gap-4">
zejście            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <span>Complete Employee Experience Preview</span>
              </DialogTitle>
              <DialogDescription className="text-base mt-2 max-w-2xl">
                Experience the complete end-to-end employee survey journey exactly as employees will see it.
                This uses the <strong>real survey components</strong> in preview mode - no data will be saved.
              </DialogDescription>
            </div>
          </div>

          {/* Survey Info Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
              <Info className="h-3.5 w-3.5" />
              Preview Mode • No Data Saved
            </Badge>
            {loadedSurveyData.consent_config && (
              <>
                <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                  <Shield className="h-3.5 w-3.5" />
                  {loadedSurveyData.consent_config.anonymization_level === "anonymous"
                    ? "Fully Anonymous"
                    : "Identified"}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                  <Clock className="h-3.5 w-3.5" />
                  Data retained for {loadedSurveyData.consent_config.data_retention_days || 60} days
                </Badge>
              </>
            )}
          </div>
        </DialogHeader>

        {/* Preview Mode Alert */}
        <Alert className="mx-8 mt-4 border-primary/50 bg-primary/10">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <strong>Real Experience Preview:</strong> You are using the actual employee survey components.
            This shows exactly what employees will experience, including consent flows, anonymization rituals,
            mood selection, chat conversations, and closing. All interactions are in preview mode - no data is saved.
          </AlertDescription>
        </Alert>

        {/* Main Content - Real Employee Survey Flow */}
        <div className="flex-1 overflow-hidden">
          <PreviewModeProvider
            isPreviewMode={true}
            previewSurveyId={loadedSurveyData.id || surveyId}
            previewSurveyData={loadedSurveyData}
          >
            <div className="h-full overflow-y-auto">
              <EmployeeSurveyFlow
                surveyId={loadedSurveyData.id || "preview-survey"}
                surveyDetails={loadedSurveyData}
                onComplete={handleComplete}
                onExit={handleExit}
              />
            </div>
          </PreviewModeProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};

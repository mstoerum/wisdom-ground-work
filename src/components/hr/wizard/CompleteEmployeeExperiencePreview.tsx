import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, Info, Eye, CheckCircle2, User, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PreviewModeProvider } from "@/contexts/PreviewModeContext";
import { EmployeeSurveyFlow } from "@/components/employee/EmployeeSurveyFlow";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
    if (!open) {
      // Reset when dialog closes
      setLoadedSurveyData(null);
      return;
    }

    if (surveyId) {
      // If surveyId is provided, use fullSurveyData from the query
      if (fullSurveyData) {
        setLoadedSurveyData(fullSurveyData);
      }
    } else {
      // If no surveyId, construct survey data from passed props
      setLoadedSurveyData({
        id: "preview-survey",
        ...surveyData,
      });
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

  const isLoading = isLoadingQuery || !loadedSurveyData;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] h-[95vh] p-0 gap-0 flex flex-col">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] h-[95vh] p-0 gap-0 flex flex-col">
        {/* Header - Simplified for preview focus */}
        <DialogHeader className="px-8 pt-6 pb-4 border-b bg-muted/30 flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Survey Preview
          </DialogTitle>
          <DialogDescription className="text-sm mt-1">
            Experience the employee survey flow - preview mode, no data saved.
          </DialogDescription>
        </DialogHeader>

        {/* Minimal Preview Badge */}
        <div className="px-8 pt-3 flex-shrink-0">
          <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
            <Info className="h-3.5 w-3.5" />
            Preview Mode
          </Badge>
        </div>

        {/* Main Content - Real Employee Survey Flow - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <PreviewModeProvider
            isPreviewMode={true}
            previewSurveyId={loadedSurveyData.id || surveyId}
            previewSurveyData={loadedSurveyData}
          >
            <div className="min-h-full">
              <EmployeeSurveyFlow
                surveyId={loadedSurveyData.id || "preview-survey"}
                surveyDetails={loadedSurveyData}
                onComplete={handleComplete}
                onExit={handleExit}
                quickPreview={true}
              />
            </div>
          </PreviewModeProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect, Component, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Info, Eye, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PreviewModeProvider } from "@/contexts/PreviewModeContext";
import { EmployeeSurveyFlow } from "@/components/employee/EmployeeSurveyFlow";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContextualTerms } from "@/lib/contextualTerminology";

// Error boundary for preview component
class PreviewErrorBoundary extends Component<
  { children: ReactNode; onExit: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; onExit: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Preview error caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2 space-y-4">
              <p className="font-semibold">Preview Error</p>
              <p>An error occurred while loading the preview. Please check that all required fields are filled in.</p>
              <Button onClick={this.props.onExit} variant="outline" size="sm">
                Close Preview
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

interface CompleteEmployeeExperiencePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyData: {
    survey_type?: string;
    title: string;
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
  const terms = useContextualTerms(surveyData.survey_type as any);
  const [loadedSurveyData, setLoadedSurveyData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch full survey data if surveyId is provided
  const { data: fullSurveyData, isLoading: isLoadingQuery, error: queryError } = useQuery({
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

  // Validate survey data structure
  const validateSurveyData = (data: any): string | null => {
    if (!data) return "Survey data is missing";
    
    // For preview mode, we're more lenient - we'll use defaults if fields are empty
    // Only validate that the consent_config object exists
    if (!data.consent_config) {
      return "Consent configuration is missing. Please complete the privacy settings before previewing.";
    }
    
    // Allow empty fields - they'll be filled with defaults below
    // Themes are optional but warn if empty
    if (!data.themes || data.themes.length === 0) {
      // This is a warning, not an error - preview can work without themes
    }
    
    return null;
  };

  // Use full survey data if available, otherwise use passed surveyData
  useEffect(() => {
    if (!open) {
      // Reset when dialog closes
      setLoadedSurveyData(null);
      setError(null);
      return;
    }

    // Reset error when opening
    setError(null);

    if (surveyId) {
      // If surveyId is provided, use fullSurveyData from the query
      if (fullSurveyData) {
        const validationError = validateSurveyData(fullSurveyData);
        if (validationError) {
          setError(validationError);
          setLoadedSurveyData(null);
        } else {
          setError(null);
          setLoadedSurveyData(fullSurveyData);
        }
      }
      if (queryError) {
        setError("Failed to load survey data. Please try again.");
        setLoadedSurveyData(null);
        return;
      }
    } else {
      // Construct data with defaults based on survey type
      try {
        const safeConsentMessage = surveyData?.consent_config?.consent_message && typeof surveyData.consent_config.consent_message === 'string'
          ? surveyData.consent_config.consent_message.trim()
          : undefined;
        
        // Set safe defaults based on survey type
        const surveyType = (surveyData as any)?.survey_type || 'employee_satisfaction';
        const defaultConsentMessage = surveyType === 'course_evaluation'
          ? "Your course evaluation will be kept confidential and used to improve the learning experience. Your feedback is valuable for enhancing teaching quality and course design."
          : "Your responses will be kept confidential and used to improve our workplace. We take your privacy seriously and follow strict data protection guidelines.";
        
        const constructedData = {
          id: "preview-survey",
          survey_type: surveyType,
          title: surveyData?.title || "Untitled Survey",
          themes: Array.isArray(surveyData?.themes) ? surveyData.themes : [],
          consent_config: {
            anonymization_level: surveyData?.consent_config?.anonymization_level || "anonymous",
            data_retention_days: surveyData?.consent_config?.data_retention_days || 60,
            consent_message: safeConsentMessage || defaultConsentMessage,
            ...(((surveyData?.consent_config as any)?.enable_spradley_evaluation !== undefined) && { enable_spradley_evaluation: (surveyData.consent_config as any).enable_spradley_evaluation }),
          } as any,
        };
        
        // Validate the constructed data with defaults
        const validationError = validateSurveyData(constructedData);
        
        if (validationError) {
          console.error("Preview validation error:", validationError);
          setError(validationError);
          setLoadedSurveyData(null);
        } else {
          setError(null);
          setLoadedSurveyData(constructedData);
        }
      } catch (constructionError) {
        console.error("Error constructing preview data:", constructionError);
        setError("Failed to prepare preview data. Please ensure all required fields are filled in.");
        setLoadedSurveyData(null);
      }
    }
  }, [fullSurveyData, surveyData, surveyId, open, queryError]);

  const handleComplete = () => {
    // Preview completed, close after a brief delay
    setTimeout(() => {
      onOpenChange(false);
    }, 1500);
  };

  const handleExit = () => {
    onOpenChange(false);
  };

  const isLoading = isLoadingQuery || (!loadedSurveyData && !error);

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

  // Show error state
  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] h-[95vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-8 pt-6 pb-4 border-b bg-muted/30 flex-shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {terms.previewDialogTitle}
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              {terms.previewDialogDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 overflow-y-auto p-8">
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="mt-2">
                <p className="font-semibold mb-2">Preview Error</p>
                <p>{error}</p>
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 max-w-2xl mx-auto">
              <p className="text-sm text-muted-foreground mb-4">
                To preview your survey, please ensure you have completed:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Survey Details step: Title and First Message</li>
                <li>Privacy Settings step: Consent Message</li>
                <li>Optional: Themes step (for better preview experience)</li>
              </ul>
            </div>
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
            {terms.previewDialogTitle}
          </DialogTitle>
          <DialogDescription className="text-sm mt-1">
            {terms.previewDialogDescription}
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
          <PreviewErrorBoundary onExit={handleExit}>
            {loadedSurveyData && loadedSurveyData.consent_config ? (
              <PreviewModeProvider
                isPreviewMode={true}
                previewSurveyId={loadedSurveyData.id || surveyId}
                previewSurveyData={{
                  ...loadedSurveyData,
                  survey_type: loadedSurveyData.survey_type || 'employee_satisfaction',
                  themes: Array.isArray(loadedSurveyData.themes) ? loadedSurveyData.themes : [],
                  consent_config: {
                    ...loadedSurveyData.consent_config,
                    consent_message: loadedSurveyData.consent_config.consent_message || (
                      loadedSurveyData.survey_type === 'course_evaluation'
                        ? "Your course evaluation will be kept confidential and used to improve the learning experience. Your feedback is valuable for enhancing teaching quality and course design."
                        : "Your responses will be kept confidential and used to improve our workplace. We take your privacy seriously and follow strict data protection guidelines."
                    ),
                    anonymization_level: loadedSurveyData.consent_config.anonymization_level || "anonymous",
                    data_retention_days: loadedSurveyData.consent_config.data_retention_days || 60,
                    enable_spradley_evaluation: loadedSurveyData.consent_config.enable_spradley_evaluation ?? false,
                  },
                }}
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
            ) : (
              <div className="flex items-center justify-center min-h-[400px] p-6">
                <Alert variant="destructive" className="max-w-md">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="mt-2">
                    <p className="font-semibold">Preview data not ready</p>
                    <p>Please wait while the preview loads, or check that all required fields are filled in.</p>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </PreviewErrorBoundary>
        </div>
      </DialogContent>
    </Dialog>
  );
};

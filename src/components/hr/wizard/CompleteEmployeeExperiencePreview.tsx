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
  const [employeeViewMode, setEmployeeViewMode] = useState(true); // Default to employee view

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
        {/* Header - Fixed at top */}
        <DialogHeader className="px-8 pt-8 pb-6 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
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
            
            {/* Employee View Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2 bg-background/50 px-4 py-2 rounded-lg border border-border/50">
                <Settings className={`h-4 w-4 ${!employeeViewMode ? 'text-primary' : 'text-muted-foreground'}`} />
                <Switch
                  id="employee-view-toggle"
                  checked={employeeViewMode}
                  onCheckedChange={setEmployeeViewMode}
                />
                <User className={`h-4 w-4 ${employeeViewMode ? 'text-primary' : 'text-muted-foreground'}`} />
                <Label htmlFor="employee-view-toggle" className="text-sm cursor-pointer">
                  {employeeViewMode ? 'Employee View' : 'Admin View'}
                </Label>
              </div>
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

        {/* Preview Mode Alert - Fixed below header */}
        {employeeViewMode ? (
          <Alert className="mx-8 mt-4 border-primary/50 bg-primary/10 flex-shrink-0">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <strong>Employee View:</strong> You are seeing exactly what employees will experience, including consent flows, anonymization rituals,
              mood selection, chat conversations, and closing. All interactions are in preview mode - no data is saved.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mx-8 mt-4 border-muted-foreground/50 bg-muted/20 flex-shrink-0">
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>Admin View:</strong> You are viewing the preview with admin controls visible. Switch to Employee View to see the exact experience employees will have.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content - Real Employee Survey Flow - Scrollable */}
        <div className={`flex-1 min-h-0 overflow-y-auto ${employeeViewMode ? '' : 'bg-muted/10'}`}>
          <PreviewModeProvider
            isPreviewMode={true}
            previewSurveyId={loadedSurveyData.id || surveyId}
            previewSurveyData={loadedSurveyData}
          >
            <div className="min-h-full">
              {employeeViewMode ? (
                <EmployeeSurveyFlow
                  surveyId={loadedSurveyData.id || "preview-survey"}
                  surveyDetails={loadedSurveyData}
                  onComplete={handleComplete}
                  onExit={handleExit}
                />
              ) : (
                <div className="p-8">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-card border border-border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Admin View Mode</h3>
                      <p className="text-muted-foreground mb-4">
                        In Admin View, you can see all the survey configuration and preview controls.
                        Switch to Employee View to experience the survey exactly as employees will see it.
                      </p>
                      <Button onClick={() => setEmployeeViewMode(true)} className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        Switch to Employee View
                      </Button>
                    </div>
                    
                    {/* Survey Configuration Preview */}
                    <div className="bg-card border border-border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Survey Configuration</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Title:</span>
                          <p className="text-base">{loadedSurveyData.title}</p>
                        </div>
                        {loadedSurveyData.first_message && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">First Message:</span>
                            <p className="text-base">{loadedSurveyData.first_message}</p>
                          </div>
                        )}
                        {loadedSurveyData.consent_config && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Consent Config:</span>
                            <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-auto">
                              {JSON.stringify(loadedSurveyData.consent_config, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </PreviewModeProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};

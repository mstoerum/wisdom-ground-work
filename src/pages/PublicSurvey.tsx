import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { EmployeeSurveyFlow } from "@/components/employee/EmployeeSurveyFlow";

export default function PublicSurvey() {
  const { linkToken } = useParams<{ linkToken: string }>();

  const { data: linkData, isLoading, error } = useQuery({
    queryKey: ["public-survey-link", linkToken],
    queryFn: async () => {
      if (!linkToken) throw new Error("No link token provided");

      // First, get the public link info
      const { data: linkInfo, error: linkError } = await supabase
        .from("public_survey_links")
        .select("*")
        .eq("link_token", linkToken)
        .eq("is_active", true)
        .single();

      if (linkError) throw new Error("Invalid or inactive survey link");
      if (!linkInfo) throw new Error("Survey link not found");

      // Check expiration
      if (linkInfo.expires_at && new Date(linkInfo.expires_at) < new Date()) {
        throw new Error("This survey link has expired");
      }

      // Check max responses
      if (linkInfo.max_responses && linkInfo.current_responses >= linkInfo.max_responses) {
        throw new Error("This survey has reached its maximum number of responses");
      }

      // Now fetch the survey data separately (RLS should allow this via the policy)
      const { data: surveyData, error: surveyError } = await supabase
        .from("surveys")
        .select("id, title, description, first_message, consent_config")
        .eq("id", linkInfo.survey_id)
        .single();

      if (surveyError || !surveyData) {
        console.error("Survey fetch error:", surveyError);
        throw new Error("Survey data not available. Please contact the survey administrator.");
      }

      return {
        ...linkInfo,
        survey: surveyData,
      };
    },
    enabled: !!linkToken,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Survey Unavailable</h2>
            </div>
            <Alert variant="destructive">
              <AlertDescription>
                {error.message || "This survey link is not valid or has expired."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!linkData?.survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert>
              <AlertDescription>
                The survey associated with this link could not be found.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the survey flow directly - no signup required
  return (
    <PublicSurveyFlow
      surveyId={linkData.survey.id}
      surveyDetails={linkData.survey}
      publicLinkId={linkData.id}
    />
  );
}

// Component that wraps EmployeeSurveyFlow for public links
function PublicSurveyFlow({
  surveyId,
  surveyDetails,
  publicLinkId,
}: {
  surveyId: string;
  surveyDetails: any;
  publicLinkId: string;
}) {
  return (
    <EmployeeSurveyFlow
      surveyId={surveyId}
      surveyDetails={surveyDetails}
      publicLinkId={publicLinkId}
    />
  );
}

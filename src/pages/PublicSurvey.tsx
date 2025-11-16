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

      // Use RPC function to fetch survey data - this bypasses RLS issues
      // and properly evaluates the relationship between link and survey
      const { data: result, error: rpcError } = await supabase.rpc(
        "get_public_survey_by_token",
        { link_token_param: linkToken }
      );

      if (rpcError) {
        console.error("RPC error:", rpcError);
        // Provide user-friendly error messages
        if (rpcError.code === 'P0001' || rpcError.message?.includes('not found')) {
          throw new Error("Invalid or inactive survey link");
        }
        if (rpcError.code === 'PGRST116') {
          throw new Error("Survey link not found. Please check the link and try again.");
        }
        if (rpcError.message?.includes('expired')) {
          throw new Error("This survey link has expired");
        }
        if (rpcError.message?.includes('max responses')) {
          throw new Error("This survey has reached its maximum number of responses");
        }
        throw new Error(`Unable to load survey. Please try again later or contact the survey administrator.`);
      }

      if (!result || result.length === 0) {
        throw new Error("Survey link not found or survey data unavailable");
      }

      const row = result[0];

      // Build link info object
      const linkInfo = {
        id: row.link_id,
        survey_id: row.link_survey_id,
        link_token: row.link_token,
        is_active: row.link_is_active,
        max_responses: row.link_max_responses,
        current_responses: row.link_current_responses,
        expires_at: row.link_expires_at,
        created_by: row.link_created_by,
        created_at: row.link_created_at,
      };

      // Build survey data object
      const surveyData = {
        id: row.survey_id,
        title: row.survey_title,
        description: row.survey_description,
        first_message: row.survey_first_message,
        consent_config: row.survey_consent_config,
      };

      // Additional validation (though the function already checks these)
      if (linkInfo.expires_at && new Date(linkInfo.expires_at) < new Date()) {
        throw new Error("This survey link has expired");
      }

      if (linkInfo.max_responses && linkInfo.current_responses >= linkInfo.max_responses) {
        throw new Error("This survey has reached its maximum number of responses");
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

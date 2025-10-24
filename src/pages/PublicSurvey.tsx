import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { PublicSurveySignup } from "@/components/public/PublicSurveySignup";
import { useState } from "react";

export default function PublicSurvey() {
  const { linkToken } = useParams<{ linkToken: string }>();
  const navigate = useNavigate();
  const [registered, setRegistered] = useState(false);

  const { data: linkData, isLoading, error } = useQuery({
    queryKey: ["public-survey-link", linkToken],
    queryFn: async () => {
      if (!linkToken) throw new Error("No link token provided");

      const { data: linkInfo, error: linkError } = await supabase
        .from("public_survey_links")
        .select(`
          *,
          survey:surveys(
            id,
            title,
            description,
            first_message,
            consent_config
          )
        `)
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

      return linkInfo;
    },
    enabled: !!linkToken,
  });

  const handleRegistrationSuccess = () => {
    setRegistered(true);
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

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
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Survey Unavailable</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
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
          <CardHeader>
            <CardTitle>Survey Not Found</CardTitle>
          </CardHeader>
          <CardContent>
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

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div>
              <h3 className="text-xl font-semibold">Registration Successful!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting you to the survey...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{linkData.survey.title}</CardTitle>
          {linkData.survey.description && (
            <CardDescription className="text-base mt-2">
              {linkData.survey.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 rounded-lg bg-accent/20 border">
            <p className="text-sm text-muted-foreground">
              {linkData.survey.first_message}
            </p>
          </div>

          <PublicSurveySignup
            surveyId={linkData.survey.id}
            linkId={linkData.id}
            onSuccess={handleRegistrationSuccess}
          />

          {linkData.expires_at && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              This survey link expires on {new Date(linkData.expires_at).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

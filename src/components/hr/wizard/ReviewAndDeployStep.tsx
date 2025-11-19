import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SurveyFormData } from "@/lib/surveySchema";
import { Calendar, Users, Shield, Target, Link2, CheckCircle2, Eye, Rocket, AlertCircle, Copy } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { CompleteEmployeeExperiencePreview } from "./CompleteEmployeeExperiencePreview";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ReviewAndDeployStepProps {
  formData: SurveyFormData;
  themeCount: number;
  targetCount: number;
  onDeploy: () => void;
  isDeploying: boolean;
  surveyId?: string | null;
  deployResult?: {
    public_link?: {
      link_token?: string;
      id?: string;
      expires_at: string | null;
      max_responses: number | null;
      current_responses?: number;
      is_active?: boolean;
    };
    assignment_count?: number;
  };
}

export const ReviewAndDeployStep = ({
  formData,
  themeCount,
  targetCount,
  onDeploy,
  isDeploying,
  surveyId,
  deployResult,
}: ReviewAndDeployStepProps) => {
  const navigate = useNavigate();
  const [showCompletePreview, setShowCompletePreview] = useState(false);
  const [showDeployConfirmation, setShowDeployConfirmation] = useState(false);

  // Get target type display
  const getTargetDisplay = () => {
    switch (formData.target_type) {
      case 'all':
        return `All employees (${targetCount} total)`;
      case 'department':
        return `${formData.target_departments?.length || 0} department(s) (${targetCount} employees)`;
      case 'manual':
        return `${formData.target_employees?.length || 0} selected employee(s)`;
      case 'public_link':
        return 'Public link (anyone with link)';
      default:
        return 'Not specified';
    }
  };

  // Get schedule display
  const getScheduleDisplay = () => {
    if (formData.schedule_type === 'immediate') {
      return 'Immediate launch';
    }
    if (formData.start_date) {
      const start = format(new Date(formData.start_date), 'PPP p');
      if (formData.end_date) {
        const end = format(new Date(formData.end_date), 'PPP p');
        return `${start} - ${end}`;
      }
      return `Starts ${start}`;
    }
    return 'Not scheduled';
  };

  const linkToken = deployResult?.public_link?.link_token;
  const surveyUrl = linkToken ? `${window.location.origin}/survey/${linkToken}` : null;

  const handleCopyLink = () => {
    if (surveyUrl) {
      navigator.clipboard.writeText(surveyUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  if (deployResult?.public_link) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">Survey Deployed Successfully!</CardTitle>
                <CardDescription className="text-base mt-1">
                  Your survey is now live and ready to collect feedback
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Public Link Display */}
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Link2 className="h-5 w-5" />
                <h4 className="font-semibold text-lg">Share This Survey Link</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Copy and share this link with participants. Anyone with the link can participate in your survey.
              </p>
              <div className="flex gap-2">
                <input
                  value={surveyUrl || ''}
                  readOnly
                  className="flex-1 px-4 py-2 bg-background border rounded-lg font-mono text-sm"
                />
                <Button onClick={handleCopyLink} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
              {deployResult.public_link.expires_at && (
                <p className="text-xs text-muted-foreground">
                  ⏰ Expires: {format(new Date(deployResult.public_link.expires_at), 'PPP p')}
                </p>
              )}
              {deployResult.public_link.max_responses && (
                <p className="text-xs text-muted-foreground">
                  📊 Maximum responses: {deployResult.public_link.max_responses}
                </p>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure to save this link in a secure place. You won't be able to retrieve it later.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message Placeholder - will show after deployment */}
      
      {/* Preview Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Preview & Test Your Survey</CardTitle>
              <CardDescription>
                Try out the survey experience before deploying to make sure everything looks good
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="default" 
                onClick={() => setShowCompletePreview(true)}
                className="bg-primary"
              >
                <Eye className="h-4 w-4 mr-2" />
                Complete Employee Survey Preview
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  Complete Employee Survey Preview
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Experience the complete end-to-end employee journey: consent, anonymization ritual, mood selection, 
                  chat conversation, and closing ritual. This shows exactly what your employees will see and helps you 
                  verify compliance and trust-building elements before deploying.
                </p>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setShowCompletePreview(true)}
                >
                  <Eye className="h-3 w-3 mr-2" />
                  Open Complete Preview
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Survey Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Survey Summary
          </CardTitle>
          <CardDescription>
            Review all settings before deploying your survey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title and Description */}
          <div>
            <h3 className="font-semibold text-lg mb-1">{formData.title}</h3>
            {formData.description && (
              <p className="text-sm text-muted-foreground">{formData.description}</p>
            )}
          </div>

          <Separator />

          {/* Survey Details Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Conversation Themes</p>
                <p className="text-sm text-muted-foreground">
                  {themeCount} {themeCount === 1 ? 'theme' : 'themes'} selected
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Target Audience</p>
                <p className="text-sm text-muted-foreground">
                  {getTargetDisplay()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Launch Schedule</p>
                <p className="text-sm text-muted-foreground">
                  {getScheduleDisplay()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Privacy Settings</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={formData.anonymization_level === 'anonymous' ? 'default' : 'secondary'}>
                    {formData.anonymization_level === 'anonymous' ? 'Anonymous' : 'Identified'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    • Retained for {formData.data_retention_days} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {formData.target_type !== 'public_link' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This survey will be assigned to <strong>{targetCount}</strong> {targetCount === 1 ? 'employee' : 'employees'}.
                {targetCount === 0 && ' Make sure you have employees in the system before deploying.'}
              </AlertDescription>
            </Alert>
          )}

          {formData.target_type === 'public_link' && (
            <Alert>
              <Link2 className="h-4 w-4" />
              <AlertDescription>
                This survey will use a public link. You'll receive a shareable link after deployment.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Deployment Actions */}
      {!showDeployConfirmation ? (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            onClick={() => setShowDeployConfirmation(true)}
            disabled={isDeploying}
            size="lg"
            className="min-w-[180px]"
          >
            <Rocket className="h-4 w-4 mr-2" />
            {isDeploying ? 'Deploying...' : 'Deploy Survey'}
          </Button>
        </div>
      ) : (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Confirm Deployment
            </CardTitle>
            <CardDescription>
              Are you ready to deploy this survey? This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium">Once deployed:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>The survey will be {formData.schedule_type === 'immediate' ? 'immediately available' : 'scheduled for launch'}</li>
                {formData.target_type !== 'public_link' && (
                  <li>{targetCount} {targetCount === 1 ? 'employee will' : 'employees will'} receive the survey assignment</li>
                )}
                {formData.target_type === 'public_link' && (
                  <li>You'll receive a public link to share with participants</li>
                )}
                <li>Survey responses will start being collected</li>
                <li>You can view analytics and insights from the dashboard</li>
              </ul>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeployConfirmation(false)}
                disabled={isDeploying}
              >
                Cancel
              </Button>
              <Button
                onClick={onDeploy}
                disabled={isDeploying}
                size="lg"
                className="min-w-[180px]"
              >
                <Rocket className="h-4 w-4 mr-2" />
                {isDeploying ? 'Deploying...' : 'Yes, Deploy Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Employee Experience Preview Dialog */}
      <CompleteEmployeeExperiencePreview
        open={showCompletePreview}
        onOpenChange={setShowCompletePreview}
        surveyData={{
          title: formData.title,
          first_message: formData.first_message,
          themes: formData.themes || [],
          consent_config: {
            anonymization_level: formData.anonymization_level,
            data_retention_days: Number(formData.data_retention_days),
            consent_message: formData.consent_message,
            ...(formData.enable_spradley_evaluation !== undefined && { enable_spradley_evaluation: formData.enable_spradley_evaluation }),
          } as any,
        }}
        surveyId={surveyId || undefined}
      />
    </div>
  );
};
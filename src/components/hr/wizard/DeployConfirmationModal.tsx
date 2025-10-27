import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SurveyFormData } from "@/lib/surveySchema";
import { DeploymentProgress } from "./DeploymentProgress";
import { Calendar, Users, Shield, Target, Link2, Copy, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface DeployConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: SurveyFormData;
  themeCount: number;
  targetCount: number;
  onConfirm: () => void;
  isDeploying: boolean;
  deployResult?: {
    public_link?: {
      link_token?: string;
      token?: string;
      expires_at: string | null;
      max_responses: number | null;
    };
    assignmentsCreated?: number;
  };
}

export const DeployConfirmationModal = ({
  open,
  onOpenChange,
  formData,
  themeCount,
  targetCount,
  onConfirm,
  isDeploying,
  deployResult,
}: DeployConfirmationModalProps) => {
  const [deployStage, setDeployStage] = useState<'validating' | 'creating_assignments' | 'deploying' | 'complete'>('validating');
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const linkToken = deployResult?.public_link?.link_token || deployResult?.public_link?.token;
  const surveyUrl = linkToken 
    ? `${window.location.origin}/survey/${linkToken}`
    : null;

  const handleCopyLink = () => {
    if (surveyUrl) {
      navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (isDeploying) {
      setDeployStage('validating');
      setProgress(0);
      
      const timer1 = setTimeout(() => {
        setDeployStage('creating_assignments');
        setProgress(33);
      }, 800);
      
      const timer2 = setTimeout(() => {
        setDeployStage('deploying');
        setProgress(66);
      }, 1600);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setDeployStage('validating');
      setProgress(0);
    }
  }, [isDeploying]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deploy Survey?</DialogTitle>
          <DialogDescription>
            {isDeploying ? "Deploying your survey..." : "Review the survey configuration before deploying to employees"}
          </DialogDescription>
        </DialogHeader>

        {isDeploying ? (
          <DeploymentProgress stage={deployStage} progress={progress} />
        ) : deployResult?.public_link ? (
          // Show public link after successful deployment
          <div className="space-y-4 py-4">
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Link2 className="h-5 w-5" />
                <h4 className="font-semibold">Survey Link Ready!</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this link to allow anyone to participate in your survey
              </p>
              <div className="flex gap-2">
                <Input
                  value={surveyUrl || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={handleCopyLink} variant="outline" className="shrink-0">
                  {copied ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              {deployResult.public_link.expires_at && (
                <p className="text-xs text-muted-foreground">
                  Expires: {format(new Date(deployResult.public_link.expires_at), "PPP 'at' p")}
                </p>
              )}
              {deployResult.public_link.max_responses && (
                <p className="text-xs text-muted-foreground">
                  Max responses: {deployResult.public_link.max_responses}
                </p>
              )}
            </div>
          </div>
        ) : (
          // Show confirmation details before deployment
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-semibold text-lg mb-2">{formData.title}</h4>
            {formData.description && (
              <p className="text-sm text-muted-foreground">{formData.description}</p>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Themes Selected</p>
                <p className="text-sm text-muted-foreground">{themeCount} conversation topics</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Target Audience</p>
                <p className="text-sm text-muted-foreground">
                  {targetCount} {targetCount === 1 ? 'employee' : 'employees'}
                  {formData.target_type === 'all' && ' (All)'}
                  {formData.target_type === 'department' && ` (${formData.target_departments?.length} departments)`}
                  {formData.target_type === 'manual' && ' (Manual selection)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Launch Timing</p>
                <p className="text-sm text-muted-foreground">
                  {formData.schedule_type === 'immediate' ? 'Immediate' : 
                    formData.start_date ? format(new Date(formData.start_date), 'PPP p') : 'Scheduled'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Privacy Level</p>
                <Badge variant={formData.anonymization_level === 'anonymous' ? 'default' : 'secondary'}>
                  {formData.anonymization_level === 'anonymous' ? 'Anonymous' : 'Identified'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeploying}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isDeploying}>
            {isDeploying ? "Deploying..." : "Deploy Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

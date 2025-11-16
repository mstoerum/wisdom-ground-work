import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Link2, Calendar, Users, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface PublicLinkDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkData: {
    link_token: string;
    expires_at: string | null;
    max_responses: number | null;
    current_responses: number;
    is_active: boolean;
  } | null;
}

export const PublicLinkDetails = ({ open, onOpenChange, linkData }: PublicLinkDetailsProps) => {
  const [copied, setCopied] = useState(false);

  if (!linkData) return null;

  const surveyUrl = `${window.location.origin}/survey/${linkData.link_token}`;
  const isExpired = linkData.expires_at && new Date(linkData.expires_at) < new Date();
  const isMaxed = linkData.max_responses && linkData.current_responses >= linkData.max_responses;
  const isActive = linkData.is_active && !isExpired && !isMaxed;

  const handleCopy = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Public Survey Link
          </DialogTitle>
          <DialogDescription>
            Share this link to allow anyone to participate in the survey
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Link Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : isExpired ? "Expired" : isMaxed ? "Max Responses Reached" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Survey URL */}
          <div className="space-y-2">
            <Label>Survey Link</Label>
            <div className="flex gap-2">
              <Input
                value={surveyUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={handleCopy} variant="outline" className="shrink-0">
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
          </div>

          {/* Link Details */}
          <div className="grid gap-4 md:grid-cols-2">
            {linkData.expires_at && (
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Expires</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(linkData.expires_at), "PPP 'at' p")}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Responses</p>
                <p className="text-sm text-muted-foreground">
                  {linkData.current_responses}
                  {linkData.max_responses ? ` / ${linkData.max_responses}` : ' total'}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">How to share:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Copy the link and share via email, Slack, or any communication channel</li>
              <li>Recipients can participate anonymously - no account or signup required</li>
              <li>Each person who clicks the link gets their own unique response session</li>
              <li>The same link can be shared with multiple people</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

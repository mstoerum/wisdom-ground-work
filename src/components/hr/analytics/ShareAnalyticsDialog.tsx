import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Link2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string;
  surveyTitle?: string;
}

export function ShareAnalyticsDialog({ open, onOpenChange, surveyId, surveyTitle }: ShareAnalyticsDialogProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 12);

      const { error } = await supabase.from("public_analytics_links" as any).insert({
        survey_id: surveyId,
        share_token: token,
        created_by: user.id,
      });

      if (error) throw error;

      const url = `${window.location.origin}/analytics/${token}`;
      setShareUrl(url);
      toast.success("Share link generated!");
    } catch (err) {
      console.error("Failed to generate share link:", err);
      toast.error("Failed to generate share link");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setShareUrl(null); setCopied(false); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Analytics</DialogTitle>
          <DialogDescription>
            Generate a public read-only link for{" "}
            <span className="font-medium text-foreground">{surveyTitle || "this survey"}</span>'s analytics dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!shareUrl ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Anyone with the link will be able to view the analytics overview — no account required.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">Read-only</Badge>
                  <Badge variant="outline" className="text-xs">No login required</Badge>
                  <Badge variant="outline" className="text-xs">Can be deactivated</Badge>
                </div>
              </div>
              <Button onClick={generateLink} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Generate Share Link
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You can deactivate this link anytime from the settings.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

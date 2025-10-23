import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ConsentModalProps {
  open: boolean;
  consentMessage?: string;
  anonymizationLevel?: string;
  dataRetentionDays?: number;
  onConsent: () => void;
  onDecline: () => void;
}

export const ConsentModal = ({ 
  open, 
  consentMessage, 
  anonymizationLevel = "anonymous",
  dataRetentionDays = 60,
  onConsent, 
  onDecline 
}: ConsentModalProps) => {
  const [agreed, setAgreed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const getProtectionBadge = () => {
    switch (anonymizationLevel) {
      case "anonymous":
        return <Badge variant="default" className="gap-1"><EyeOff className="h-3 w-3" />Fully Anonymous</Badge>;
      case "partial":
        return <Badge variant="secondary" className="gap-1"><Eye className="h-3 w-3" />Partially Anonymous</Badge>;
      case "identified":
        return <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" />Identified</Badge>;
      default:
        return <Badge variant="default" className="gap-1"><Shield className="h-3 w-3" />Protected</Badge>;
    }
  };

  const defaultMessage = `**How Your Data is Protected**
- All responses may be anonymized based on survey settings
- Data is encrypted both in transit and at rest
- Only aggregated insights are shared with management
- Individual responses are analyzed for themes only

**Your Rights**
- Participation is completely voluntary
- You may end the conversation at any time
- You control what information you share
- No individual feedback will be used against you

**Purpose**
This feedback helps us understand employee well-being and improve our workplace. Your honest insights are valuable and will be handled with the utmost care.

**Data Retention**
Anonymized feedback is retained for analytical purposes according to company policy.`;

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Privacy & Consent
            </DialogTitle>
            {getProtectionBadge()}
          </div>
          <DialogDescription>
            Your privacy is protected. Review how your data is handled.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {/* Key Protection Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Your Data is Protected</h4>
                  <p className="text-sm text-muted-foreground">
                    {anonymizationLevel === "anonymous" && "Your identity is completely hidden. Responses cannot be traced back to you."}
                    {anonymizationLevel === "partial" && "Your responses are partially anonymized. Some metadata may be visible to analytics."}
                    {anonymizationLevel === "identified" && "Your identity is associated with responses, but handled confidentially."}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Data Retention</h4>
                  <p className="text-sm text-muted-foreground">
                    Your feedback will be retained for <strong>{dataRetentionDays} days</strong> for analysis, then automatically deleted.
                  </p>
                </div>
              </div>
            </div>

            {/* What You Should Know */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">What You Should Know</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>All data is encrypted in transit and at rest using industry-standard protocols</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Only aggregated insights are shared with management—individual responses stay private</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>You can end the conversation at any time without consequences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Participation is completely voluntary and confidential</span>
                </li>
              </ul>
            </div>

            {/* Expandable Details */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:text-primary transition-colors">
                <span className="text-sm font-semibold">How Your Data is Protected (Details)</span>
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="border-l-2 border-primary/20 pl-4 space-y-3">
                  <div>
                    <h5 className="font-semibold text-sm mb-1">What Data is Collected?</h5>
                    <p className="text-sm text-muted-foreground">
                      Your conversation messages, timestamps, and sentiment analysis. 
                      {anonymizationLevel === "identified" && " Your user ID is also stored."}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-sm mb-1">How is it Anonymized?</h5>
                    <p className="text-sm text-muted-foreground">
                      {anonymizationLevel === "anonymous" && "Your responses are stored with a random anonymous token instead of your user ID. Nobody can trace responses back to you."}
                      {anonymizationLevel === "partial" && "Demographic metadata (like department) may be stored, but without directly identifying information."}
                      {anonymizationLevel === "identified" && "Your user ID is stored with responses but handled with strict access controls. Only authorized HR personnel can access identifiable data."}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-sm mb-1">Who Can See What?</h5>
                    <p className="text-sm text-muted-foreground">
                      <strong>HR Analysts see:</strong> Aggregated trends, sentiment scores, theme summaries<br />
                      <strong>HR Analysts do NOT see:</strong> {anonymizationLevel === "anonymous" ? "Individual responses or any identifying information" : "Raw conversation details without proper authorization"}<br />
                      <strong>Your Manager sees:</strong> Nothing. Individual feedback is never shared with direct managers.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-sm mb-1">Data Security & Compliance</h5>
                    <p className="text-sm text-muted-foreground">
                      We follow GDPR-compliant data handling practices. Your data is encrypted using AES-256 encryption at rest and TLS 1.3 in transit. Access logs are maintained for all data access.
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Custom Message if provided */}
            {consentMessage && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-muted-foreground whitespace-pre-line">{consentMessage}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center space-x-2 py-4 border-t">
          <Checkbox
            id="consent"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <Label htmlFor="consent" className="text-sm font-normal cursor-pointer">
            I have read and understood how my data is protected and consent to participate
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDecline}>
            Decline
          </Button>
          <Button onClick={onConsent} disabled={!agreed}>
            <Shield className="h-4 w-4 mr-2" />
            I Consent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

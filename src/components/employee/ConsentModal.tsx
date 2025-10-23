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

interface ConsentModalProps {
  open: boolean;
  consentMessage?: string;
  onConsent: () => void;
  onDecline: () => void;
}

export const ConsentModal = ({ open, consentMessage, onConsent, onDecline }: ConsentModalProps) => {
  const [agreed, setAgreed] = useState(false);

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Privacy & Consent</DialogTitle>
          <DialogDescription>
            Please review the following before participating
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4 text-sm whitespace-pre-line text-muted-foreground">
            {consentMessage || defaultMessage}
          </div>
        </ScrollArea>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="consent"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <Label htmlFor="consent" className="text-sm font-normal cursor-pointer">
            I have read and understood the privacy policy and consent to participate
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDecline}>
            Decline
          </Button>
          <Button onClick={onConsent} disabled={!agreed}>
            I Consent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

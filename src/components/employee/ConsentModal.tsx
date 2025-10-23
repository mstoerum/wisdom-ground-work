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
  onConsent: () => void;
  onDecline: () => void;
}

export const ConsentModal = ({ open, onConsent, onDecline }: ConsentModalProps) => {
  const [agreed, setAgreed] = useState(false);

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
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">How Your Data is Protected</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>All responses are fully anonymized before storage</li>
                <li>Your identity is never linked to your feedback</li>
                <li>Data is encrypted both in transit and at rest</li>
                <li>Only aggregated insights are shared with management</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Your Rights</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Participation is completely voluntary</li>
                <li>You may end the conversation at any time</li>
                <li>You control what information you share</li>
                <li>No individual feedback will be used against you</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Purpose</h3>
              <p className="text-muted-foreground">
                This feedback helps us understand employee well-being and improve our workplace.
                Your honest insights are valuable and will be handled with the utmost care and confidentiality.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Data Retention</h3>
              <p className="text-muted-foreground">
                Anonymized feedback is retained for analytical purposes. Individual conversation
                sessions are automatically deleted after aggregation.
              </p>
            </section>
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

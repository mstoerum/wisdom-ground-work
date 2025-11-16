import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface FinishEarlyConfirmationDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  themeCoverage: {
    discussed: number;
    total: number;
    percentage: number;
  };
  exchangeCount: number;
  minExchanges: number;
}

export const FinishEarlyConfirmationDialog = ({
  open,
  onConfirm,
  onCancel,
  themeCoverage,
  exchangeCount,
  minExchanges,
}: FinishEarlyConfirmationDialogProps) => {
  const isIncomplete = themeCoverage.percentage < 60 || exchangeCount < minExchanges;
  const coverageText = themeCoverage.total > 0
    ? `${themeCoverage.discussed} of ${themeCoverage.total} themes`
    : "some topics";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isIncomplete ? (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Finish Early?
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Ready to Finish?
              </>
            )}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {isIncomplete ? (
              <>
                We've explored {coverageText} so far ({Math.round(themeCoverage.percentage)}% coverage).
                There's still more to explore for a complete picture.
              </>
            ) : (
              <>
                We've covered {coverageText} ({Math.round(themeCoverage.percentage)}% coverage).
                You can finish now or continue if you'd like to share more.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isIncomplete && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-900">
              <strong>Before you finish:</strong> We'll summarize what you've shared and ask one final question
              to ensure we have a clear picture of your experience. This helps us gather complete feedback.
            </AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {isIncomplete ? (
              <>
                If you're sure you want to finish now, we'll:
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Summarize what you've shared so far</li>
                  <li>Ask one final important question</li>
                  <li>Give you a chance to add anything else</li>
                </ul>
              </>
            ) : (
              <>
                We'll summarize your feedback and give you a final chance to add anything else
                before completing the survey.
              </>
            )}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Continue Conversation
          </Button>
          <Button onClick={onConfirm} variant={isIncomplete ? "default" : "default"}>
            Yes, Finish Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

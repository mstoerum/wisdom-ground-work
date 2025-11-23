import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageCircle } from "lucide-react";

interface CompletionConfirmationButtonsProps {
  onComplete: () => void;
  onAddMore: () => void;
  isLoading: boolean;
}

export const CompletionConfirmationButtons = ({
  onComplete,
  onAddMore,
  isLoading
}: CompletionConfirmationButtonsProps) => {
  return (
    <div className="p-4 bg-muted/30 border-t border-border/50">
      <p className="text-sm text-muted-foreground mb-3 text-center">
        Does this summary capture everything you wanted to share?
      </p>
      <div className="flex gap-3 justify-center">
        <Button
          onClick={onAddMore}
          variant="outline"
          size="lg"
          disabled={isLoading}
          className="flex-1 max-w-[200px]"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Add More
        </Button>
        <Button
          onClick={onComplete}
          variant="coral"
          size="lg"
          disabled={isLoading}
          className="flex-1 max-w-[200px]"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Complete Survey
        </Button>
      </div>
    </div>
  );
};

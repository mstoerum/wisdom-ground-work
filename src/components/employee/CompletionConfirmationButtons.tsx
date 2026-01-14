import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageCirclePlus } from "lucide-react";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="p-5 bg-gradient-to-t from-muted/50 to-transparent border-t border-border/30"
    >
      <p className="text-base font-medium text-center mb-4">
        Does this capture everything?
      </p>
      <div className="flex gap-3 justify-center">
        <Button
          onClick={onAddMore}
          variant="outline"
          size="lg"
          disabled={isLoading}
          className="min-w-[140px] border-border/50 hover:bg-muted/50"
        >
          <MessageCirclePlus className="h-4 w-4 mr-2" />
          Add more
        </Button>
        <Button
          onClick={onComplete}
          variant="coral"
          size="lg"
          disabled={isLoading}
          className="min-w-[160px] shadow-md hover:shadow-lg transition-shadow"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          End conversation
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-3">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> to submit
      </p>
    </motion.div>
  );
};

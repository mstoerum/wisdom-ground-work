import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  isNextDisabled?: boolean;
  isSaving?: boolean;
}

export const WizardNavigation = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSaveDraft,
  isNextDisabled = false,
  isSaving = false,
}: WizardNavigationProps) => {
  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <div>
        {currentStep > 1 && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onSaveDraft} disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Draft"}
        </Button>
        {currentStep < totalSteps && (
          <Button onClick={onNext} disabled={isNextDisabled}>
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

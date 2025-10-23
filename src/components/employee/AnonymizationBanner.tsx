import { Shield, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const AnonymizationBanner = () => {
  return (
    <Alert className="bg-muted/50 border-border/50">
      <div className="flex items-start gap-3">
        <Shield className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <AlertDescription className="text-sm">
            <div className="font-medium mb-1 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Your Privacy is Protected
            </div>
            <p className="text-muted-foreground">
              Your responses are fully anonymized. Your identity is never linked to your feedback.
              We use encryption and strict access controls to ensure confidentiality.
            </p>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

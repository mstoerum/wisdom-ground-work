import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Briefcase, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface AudienceToggleProps {
  value: 'executive' | 'manager';
  onChange: (value: 'executive' | 'manager') => void;
  disabled?: boolean;
}

export function AudienceToggle({ value, onChange, disabled }: AudienceToggleProps) {
  const [pendingValue, setPendingValue] = useState<'executive' | 'manager' | null>(null);

  const handleClick = (newValue: 'executive' | 'manager') => {
    if (newValue === value) return; // Already active, no-op
    setPendingValue(newValue);
  };

  const handleConfirm = () => {
    if (pendingValue) {
      onChange(pendingValue);
      setPendingValue(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
        <Button
          variant={value === 'executive' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleClick('executive')}
          disabled={disabled}
          className={cn(
            "gap-2",
            value === 'executive' && "bg-background shadow-sm"
          )}
        >
          <Briefcase className="h-4 w-4" />
          Executive View
        </Button>
        <Button
          variant={value === 'manager' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => handleClick('manager')}
          disabled={disabled}
          className={cn(
            "gap-2",
            value === 'manager' && "bg-background shadow-sm"
          )}
        >
          <Users className="h-4 w-4" />
          Manager View
        </Button>
      </div>

      <AlertDialog open={!!pendingValue} onOpenChange={(open) => !open && setPendingValue(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch report view?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching views will regenerate the report using AI. This may take 15–30 seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Switch to {pendingValue === 'executive' ? 'Executive' : 'Manager'} View
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

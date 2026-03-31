import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Shield, FileText } from "lucide-react";
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

type AudienceType = 'executive' | 'manager' | 'hr_leadership' | 'detailed';

interface AudienceToggleProps {
  value: AudienceType;
  onChange: (value: AudienceType) => void;
  disabled?: boolean;
}

const AUDIENCE_OPTIONS: { value: AudienceType; label: string; icon: typeof Briefcase }[] = [
  { value: 'executive', label: 'Executive', icon: Briefcase },
  { value: 'hr_leadership', label: 'HR Lead', icon: Shield },
  { value: 'manager', label: 'Manager', icon: Users },
  { value: 'detailed', label: 'Detailed', icon: FileText },
];

export function AudienceToggle({ value, onChange, disabled }: AudienceToggleProps) {
  const [pendingValue, setPendingValue] = useState<AudienceType | null>(null);

  const handleClick = (newValue: AudienceType) => {
    if (newValue === value) return;
    setPendingValue(newValue);
  };

  const handleConfirm = () => {
    if (pendingValue) {
      onChange(pendingValue);
      setPendingValue(null);
    }
  };

  const pendingLabel = AUDIENCE_OPTIONS.find(o => o.value === pendingValue)?.label || '';

  return (
    <>
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
        {AUDIENCE_OPTIONS.map(opt => {
          const Icon = opt.icon;
          return (
            <Button
              key={opt.value}
              variant={value === opt.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleClick(opt.value)}
              disabled={disabled}
              className={cn(
                "gap-1.5 text-xs px-2",
                value === opt.value && "bg-background shadow-sm"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{opt.label}</span>
            </Button>
          );
        })}
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
              Switch to {pendingLabel} View
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

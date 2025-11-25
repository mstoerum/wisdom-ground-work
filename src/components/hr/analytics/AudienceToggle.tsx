import { Button } from "@/components/ui/button";
import { Briefcase, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudienceToggleProps {
  value: 'executive' | 'manager';
  onChange: (value: 'executive' | 'manager') => void;
  disabled?: boolean;
}

export function AudienceToggle({ value, onChange, disabled }: AudienceToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant={value === 'executive' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onChange('executive')}
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
        onClick={() => onChange('manager')}
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
  );
}

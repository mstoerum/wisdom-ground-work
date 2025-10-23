import { CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DeploymentProgressProps {
  stage: 'validating' | 'creating_assignments' | 'deploying' | 'complete';
  progress: number;
}

export const DeploymentProgress = ({ stage, progress }: DeploymentProgressProps) => {
  const stages = [
    { id: 'validating', label: 'Validating survey configuration' },
    { id: 'creating_assignments', label: 'Creating employee assignments' },
    { id: 'deploying', label: 'Activating survey' },
    { id: 'complete', label: 'Deployment complete' },
  ];

  const currentIndex = stages.findIndex(s => s.id === stage);

  return (
    <div className="space-y-4 py-4">
      <Progress value={progress} className="w-full" />
      <div className="space-y-2">
        {stages.map((s, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={s.id} className="flex items-center gap-3">
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : isCurrent ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
              <span className={`text-sm ${isCurrent ? 'font-medium' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

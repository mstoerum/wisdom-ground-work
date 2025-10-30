import { DonutProgressRing } from "./DonutProgressRing";

interface ParticipationChartProps {
  completed: number;
  pending: number;
}

export const ParticipationChart = ({ completed, pending }: ParticipationChartProps) => {
  const total = completed + pending;
  const completionPercentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      <DonutProgressRing 
        value={completionPercentage}
        size="lg"
        label="Completed"
        color="terracotta"
      />
      <div className="grid grid-cols-2 gap-8 text-center">
        <div>
          <p className="text-3xl font-bold text-[hsl(var(--terracotta-primary))]">{completed}</p>
          <p className="text-sm text-muted-foreground mt-1">Completed</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-muted-foreground">{pending}</p>
          <p className="text-sm text-muted-foreground mt-1">Pending</p>
        </div>
      </div>
    </div>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Commitment } from "@/hooks/useCommitments";

interface CommitmentFormProps {
  surveyId: string;
  commitment?: Commitment;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const CommitmentForm = ({ surveyId, commitment, onSubmit, onCancel }: CommitmentFormProps) => {
  const [description, setDescription] = useState(commitment?.action_description || "");
  const [status, setStatus] = useState(commitment?.status || "pending");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    commitment?.due_date ? new Date(commitment.due_date) : undefined
  );
  const [visibleToEmployees, setVisibleToEmployees] = useState(commitment?.visible_to_employees || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      survey_id: surveyId,
      action_description: description,
      status,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      visible_to_employees: visibleToEmployees,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Action Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the action commitment..."
          required
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="visible"
            checked={visibleToEmployees}
            onCheckedChange={setVisibleToEmployees}
          />
          <Label htmlFor="visible">Visible to Employees</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {commitment ? "Update" : "Create"} Commitment
        </Button>
      </div>
    </form>
  );
};

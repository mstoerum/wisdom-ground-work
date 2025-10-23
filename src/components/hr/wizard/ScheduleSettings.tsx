import { UseFormReturn } from "react-hook-form";
import { SurveyFormData } from "@/lib/surveySchema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ScheduleSettingsProps {
  form: UseFormReturn<SurveyFormData>;
}

export const ScheduleSettings = ({ form }: ScheduleSettingsProps) => {
  const scheduleType = form.watch("schedule_type");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Schedule & Timing</h2>
        <p className="text-muted-foreground mt-1">
          Configure when the survey should be available
        </p>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Estimated Employee Time</p>
              <p className="text-sm text-muted-foreground">
                Employees typically need 10-20 minutes to complete a conversational survey
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <FormField
        control={form.control}
        name="schedule_type"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel>Launch Timing *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="font-normal cursor-pointer">
                    Launch Immediately (Deploy as soon as you confirm)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="font-normal cursor-pointer">
                    Schedule for Later
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {scheduleType === 'scheduled' && (
        <div className="space-y-4 pl-6 border-l-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date & Time *</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>When should employees be able to start the survey?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date & Time (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>When should the survey close? Leave empty for no end date</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Send periodic reminders to employees who haven't completed the survey
            </p>
          </div>
          <Switch
            checked={form.watch("reminder_frequency") !== undefined}
            onCheckedChange={(checked) => {
              form.setValue("reminder_frequency", checked ? 7 : undefined);
            }}
          />
        </div>

        {form.watch("reminder_frequency") !== undefined && (
          <FormField
            control={form.control}
            name="reminder_frequency"
            render={({ field }) => (
              <FormItem className="pl-6">
                <FormLabel>Reminder Frequency</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="3">Every 3 days</SelectItem>
                    <SelectItem value="7">Every 7 days (Weekly)</SelectItem>
                    <SelectItem value="14">Every 14 days (Bi-weekly)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
};

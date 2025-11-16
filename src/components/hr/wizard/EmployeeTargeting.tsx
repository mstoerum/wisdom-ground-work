import { UseFormReturn } from "react-hook-form";
import { SurveyFormData } from "@/lib/surveySchema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Building2, UserCheck, Link2, Calendar, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useContextualTerms } from "@/lib/contextualTerminology";

interface EmployeeTargetingProps {
  form: UseFormReturn<SurveyFormData>;
}

export function EmployeeTargeting({ form }: EmployeeTargetingProps) {
  const surveyType = form.watch("survey_type");
  const terms = useContextualTerms(surveyType);
  const targetType = form.watch("target_type");
  const targetDepartments = form.watch("target_departments");
  const targetEmployees = form.watch("target_employees");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("is_active", true).order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const departments = Array.from(new Set(profiles?.map((p) => p.department).filter(Boolean)));
  const getTargetCount = () => {
    if (targetType === "all") return profiles?.length || 0;
    if (targetType === "department") return profiles?.filter((p) => targetDepartments?.includes(p.department || "")).length || 0;
    if (targetType === "manual") return targetEmployees?.length || 0;
    if (targetType === "public_link") return "Unlimited";
    return 0;
  };

  if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{terms.targetLabel}</h3>
        <p className="text-sm text-muted-foreground">Choose which {terms.participants} should receive this survey</p>
      </div>

      <FormField control={form.control} name="target_type" render={({ field }) => (
        <FormItem className="space-y-3">
          <FormControl>
            <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-3">
              <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <FormControl><RadioGroupItem value="all" /></FormControl>
                <div className="flex-1 space-y-1">
                  <FormLabel className="flex items-center gap-2 font-medium cursor-pointer"><Users className="h-4 w-4" />All {terms.Participants}</FormLabel>
                  <FormDescription>Send to all registered {terms.participants}</FormDescription>
                </div>
              </FormItem>
              <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <FormControl><RadioGroupItem value="department" /></FormControl>
                <div className="flex-1 space-y-1">
                  <FormLabel className="flex items-center gap-2 font-medium cursor-pointer"><Building2 className="h-4 w-4" />Specific Departments</FormLabel>
                  <FormDescription>Target specific departments or teams</FormDescription>
                </div>
              </FormItem>
              <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <FormControl><RadioGroupItem value="manual" /></FormControl>
                <div className="flex-1 space-y-1">
                  <FormLabel className="flex items-center gap-2 font-medium cursor-pointer"><UserCheck className="h-4 w-4" />Select Individual {terms.Participants}</FormLabel>
                  <FormDescription>Manually choose specific {terms.participants}</FormDescription>
                </div>
              </FormItem>
              <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <FormControl><RadioGroupItem value="public_link" /></FormControl>
                <div className="flex-1 space-y-1">
                  <FormLabel className="flex items-center gap-2 font-medium cursor-pointer"><Link2 className="h-4 w-4" />Public Link</FormLabel>
                  <FormDescription>Generate a shareable link</FormDescription>
                </div>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {targetType === "department" && <div className="border rounded-lg p-4 space-y-3"><h4 className="font-medium">Select Departments</h4><FormField control={form.control} name="target_departments" render={() => (<FormItem><div className="space-y-2">{departments.map((dept) => (<FormField key={dept} control={form.control} name="target_departments" render={({ field }) => (<FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={field.value?.includes(dept)} onCheckedChange={(checked) => { const current = field.value || []; field.onChange(checked ? [...current, dept] : current.filter((d) => d !== dept)); }} /></FormControl><FormLabel className="font-normal cursor-pointer">{dept}</FormLabel></FormItem>)} />))}</div><FormMessage /></FormItem>)} /></div>}

      {targetType === "manual" && <div className="border rounded-lg p-4 space-y-3"><h4 className="font-medium">Select {terms.Participants}</h4><FormField control={form.control} name="target_employees" render={() => (<FormItem><div className="space-y-2 max-h-60 overflow-y-auto">{profiles?.map((profile) => (<FormField key={profile.id} control={form.control} name="target_employees" render={({ field }) => (<FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={field.value?.includes(profile.id)} onCheckedChange={(checked) => { const current = field.value || []; field.onChange(checked ? [...current, profile.id] : current.filter((id) => id !== profile.id)); }} /></FormControl><FormLabel className="font-normal cursor-pointer flex-1"><div><div>{profile.full_name || profile.email}</div>{profile.department && <div className="text-xs text-muted-foreground">{profile.department}</div>}</div></FormLabel></FormItem>)} />))}</div><FormMessage /></FormItem>)} /></div>}

      <div className="bg-muted/50 rounded-lg p-4"><div className="flex items-center justify-between"><span className="text-sm font-medium">Target Audience:</span><span className="text-sm font-semibold">{getTargetCount() === "Unlimited" ? "Unlimited" : `${getTargetCount()} ${terms.participants}`}</span></div></div>
    </div>
  );
}

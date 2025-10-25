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

interface EmployeeTargetingProps {
  form: UseFormReturn<SurveyFormData>;
}

export function EmployeeTargeting({ form }: EmployeeTargetingProps) {
  const targetType = form.watch("target_type");
  const targetDepartments = form.watch("target_departments");
  const targetEmployees = form.watch("target_employees");
  const linkExpiresAt = form.watch("link_expires_at");
  const maxLinkResponses = form.watch("max_link_responses");

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .order("full_name");
      
      if (error) throw error;
      return data;
    },
  });

  const departments = Array.from(
    new Set(profiles?.map((p) => p.department).filter(Boolean))
  );

  const getTargetCount = () => {
    if (targetType === "all") {
      return profiles?.length || 0;
    }
    if (targetType === "department") {
      return profiles?.filter((p) => 
        targetDepartments?.includes(p.department || "")
      ).length || 0;
    }
    if (targetType === "manual") {
      return targetEmployees?.length || 0;
    }
    if (targetType === "public_link") {
      return "Unlimited";
    }
    return 0;
  };

  const targetCount = getTargetCount();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Survey Distribution</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you want to distribute this survey
        </p>
      </div>

      <FormField
        control={form.control}
        name="target_type"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="space-y-3"
              >
                <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                  <FormControl>
                    <RadioGroupItem value="all" />
                  </FormControl>
                  <div className="flex-1 space-y-1">
                    <FormLabel className="flex items-center gap-2 font-medium cursor-pointer">
                      <Users className="h-4 w-4" />
                      All Employees
                    </FormLabel>
                    <FormDescription>
                      Send to all registered employees in the organization
                    </FormDescription>
                  </div>
                </FormItem>

                <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                  <FormControl>
                    <RadioGroupItem value="department" />
                  </FormControl>
                  <div className="flex-1 space-y-1">
                    <FormLabel className="flex items-center gap-2 font-medium cursor-pointer">
                      <Building2 className="h-4 w-4" />
                      Specific Departments
                    </FormLabel>
                    <FormDescription>
                      Target employees from selected departments
                    </FormDescription>
                  </div>
                </FormItem>

                <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                  <FormControl>
                    <RadioGroupItem value="manual" />
                  </FormControl>
                  <div className="flex-1 space-y-1">
                    <FormLabel className="flex items-center gap-2 font-medium cursor-pointer">
                      <UserCheck className="h-4 w-4" />
                      Manual Selection
                    </FormLabel>
                    <FormDescription>
                      Manually select individual employees
                    </FormDescription>
                  </div>
                </FormItem>

                <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                  <FormControl>
                    <RadioGroupItem value="public_link" />
                  </FormControl>
                  <div className="flex-1 space-y-1">
                    <FormLabel className="flex items-center gap-2 font-medium cursor-pointer">
                      <Link2 className="h-4 w-4" />
                      Public Link
                    </FormLabel>
                    <FormDescription>
                      Share via link - anyone with the link can register and participate
                    </FormDescription>
                  </div>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {targetType === "department" && (
        <FormField
          control={form.control}
          name="target_departments"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Select Departments</FormLabel>
                <FormDescription>
                  Choose which departments should receive this survey
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departments.map((dept) => (
                  <FormField
                    key={dept}
                    control={form.control}
                    name="target_departments"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(dept)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              field.onChange(
                                checked
                                  ? [...value, dept]
                                  : value.filter((d) => d !== dept)
                              );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex-1">
                          {dept}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {targetType === "manual" && (
        <FormField
          control={form.control}
          name="target_employees"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Select Employees</FormLabel>
                <FormDescription>
                  Choose individual employees who should receive this survey
                </FormDescription>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-3">
                {profiles?.map((profile) => (
                  <FormField
                    key={profile.id}
                    control={form.control}
                    name="target_employees"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(profile.id)}
                            onCheckedChange={(checked) => {
                              const value = field.value || [];
                              field.onChange(
                                checked
                                  ? [...value, profile.id]
                                  : value.filter((id) => id !== profile.id)
                              );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex-1">
                          <div>
                            <div className="font-medium">{profile.full_name || profile.email}</div>
                            {profile.department && (
                              <div className="text-xs text-muted-foreground">
                                {profile.department}
                              </div>
                            )}
                          </div>
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {targetType === "public_link" && (
        <div className="space-y-4 rounded-lg border p-4 bg-accent/20">
          <div className="space-y-2">
            <h4 className="font-medium">Public Link Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Configure optional limits for your public survey link
            </p>
          </div>

          <FormField
            control={form.control}
            name="link_expires_at"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Link Expiration (Optional)
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>No expiration</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString() || null)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Link will stop working after this date
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_link_responses"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Maximum Responses (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    min={1}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormDescription>
                  Link will stop accepting responses after this number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <div className="rounded-lg border p-4 bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Target Audience</p>
            <p className="text-xs text-muted-foreground mt-1">
              {targetType === "all" && "All employees in organization"}
              {targetType === "department" && `${targetDepartments?.length || 0} department(s) selected`}
              {targetType === "manual" && "Manually selected employees"}
              {targetType === "public_link" && "Anyone with the link"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{targetCount}</p>
            <p className="text-xs text-muted-foreground">
              {targetType === "public_link" ? "potential" : "employee(s)"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

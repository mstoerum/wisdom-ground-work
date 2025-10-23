import { UseFormReturn } from "react-hook-form";
import { SurveyFormData } from "@/lib/surveySchema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";

interface EmployeeTargetingProps {
  form: UseFormReturn<SurveyFormData>;
}

export const EmployeeTargeting = ({ form }: EmployeeTargetingProps) => {
  const targetType = form.watch("target_type");
  const [targetCount, setTargetCount] = useState(0);

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
  });

  const departments = [...new Set(profiles?.map(p => p.department).filter(Boolean))];

  useEffect(() => {
    if (!profiles) return;

    if (targetType === 'all') {
      setTargetCount(profiles.length);
    } else if (targetType === 'department') {
      const selectedDepts = form.watch("target_departments") || [];
      const count = profiles.filter(p => p.department && selectedDepts.includes(p.department)).length;
      setTargetCount(count);
    } else if (targetType === 'manual') {
      const selectedEmployees = form.watch("target_employees") || [];
      setTargetCount(selectedEmployees.length);
    }
  }, [targetType, form.watch("target_departments"), form.watch("target_employees"), profiles]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Target Employees</h2>
        <p className="text-muted-foreground mt-1">
          Define who should receive this survey
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              Target audience: <Badge variant="secondary">{targetCount} employees</Badge>
            </span>
          </div>
        </CardContent>
      </Card>

      <FormField
        control={form.control}
        name="target_type"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel>Targeting Method *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal cursor-pointer">
                    All Employees (Recommended)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="department" id="department" />
                  <Label htmlFor="department" className="font-normal cursor-pointer">
                    Specific Departments
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="font-normal cursor-pointer">
                    Manual Selection
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {targetType === 'department' && (
        <FormField
          control={form.control}
          name="target_departments"
          render={() => (
            <FormItem>
              <FormLabel>Select Departments</FormLabel>
              <FormDescription>Choose which departments to include</FormDescription>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {departments.map((dept) => (
                  <FormField
                    key={dept}
                    control={form.control}
                    name="target_departments"
                    render={({ field }) => {
                      return (
                        <FormItem key={dept} className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(dept)}
                              onCheckedChange={(checked) => {
                                const updated = checked
                                  ? [...(field.value || []), dept]
                                  : field.value?.filter((d) => d !== dept) || [];
                                field.onChange(updated);
                              }}
                            />
                          </FormControl>
                          <Label className="font-normal cursor-pointer">{dept}</Label>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {targetType === 'manual' && (
        <FormField
          control={form.control}
          name="target_employees"
          render={() => (
            <FormItem>
              <FormLabel>Select Employees</FormLabel>
              <FormDescription>Choose individual employees to include</FormDescription>
              <div className="border rounded-md max-h-64 overflow-y-auto mt-2">
                <div className="divide-y">
                  {profiles?.map((profile) => (
                    <FormField
                      key={profile.id}
                      control={form.control}
                      name="target_employees"
                      render={({ field }) => {
                        return (
                          <FormItem key={profile.id} className="flex items-center space-x-3 p-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(profile.id)}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...(field.value || []), profile.id]
                                    : field.value?.filter((id) => id !== profile.id) || [];
                                  field.onChange(updated);
                                }}
                              />
                            </FormControl>
                            <div className="flex-1">
                              <Label className="font-medium cursor-pointer">
                                {profile.full_name || profile.email}
                              </Label>
                              {profile.department && (
                                <p className="text-xs text-muted-foreground">{profile.department}</p>
                              )}
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

import { UseFormReturn } from "react-hook-form";
import { SurveyFormData } from "@/lib/surveySchema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface ThemeSelectorProps {
  form: UseFormReturn<SurveyFormData>;
}

export const ThemeSelector = ({ form }: ThemeSelectorProps) => {
  const { data: themes, isLoading } = useQuery({
    queryKey: ['survey-themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_themes')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const selectedThemes = form.watch("themes");
  const estimatedMinutes = selectedThemes.length * 5;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select Conversation Themes</h2>
        <p className="text-muted-foreground mt-1">
          Choose the topics the AI will explore with employees
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          Estimated conversation time: <strong>{estimatedMinutes} minutes</strong>
        </span>
      </div>

      <FormField
        control={form.control}
        name="themes"
        render={() => (
          <FormItem>
            <FormLabel>Themes *</FormLabel>
            <FormDescription>Select at least one theme to include in the survey</FormDescription>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-40" />
                  ))}
                </>
              ) : (
                themes?.map((theme) => (
                  <FormField
                    key={theme.id}
                    control={form.control}
                    name="themes"
                    render={({ field }) => {
                      const isChecked = field.value?.includes(theme.id);
                      return (
                        <FormItem key={theme.id}>
                          <Card className={isChecked ? "border-primary" : ""}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-base">{theme.name}</CardTitle>
                                  <CardDescription className="mt-1 text-xs">
                                    {theme.description}
                                  </CardDescription>
                                </div>
                                <FormControl>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      const updated = checked
                                        ? [...(field.value || []), theme.id]
                                        : field.value?.filter((id) => id !== theme.id) || [];
                                      field.onChange(updated);
                                    }}
                                  />
                                </FormControl>
                              </div>
                            </CardHeader>
                            {theme.suggested_questions && (
                              <CardContent>
                                <div className="flex flex-wrap gap-1">
                                  {(theme.suggested_questions as string[]).slice(0, 2).map((q, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {q.length > 30 ? q.substring(0, 30) + '...' : q}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        </FormItem>
                      );
                    }}
                  />
                ))
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

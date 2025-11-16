import { UseFormReturn } from "react-hook-form";
import { SurveyFormData } from "@/lib/surveySchema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, HelpCircle } from "lucide-react";

interface ThemeSelectorProps {
  form: UseFormReturn<SurveyFormData>;
}

export const ThemeSelector = ({ form }: ThemeSelectorProps) => {
  const surveyType = form.watch("survey_type") as 'employee_satisfaction' | 'course_evaluation';
  
  const { data: themes, isLoading } = useQuery({
    queryKey: ['survey-themes', surveyType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_themes')
        .select('*')
        .eq('is_active', true)
        .eq('survey_type', surveyType)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const selectedThemes = form.watch("themes");
  
  // Calculate estimated time based on adaptive theme exploration
  // Conversations complete when themes are adequately explored, not after fixed exchanges
  // Completion criteria: 60%+ coverage with 2+ exchanges per theme, OR 80%+ coverage
  // Each exchange takes ~1-1.5 minutes (user response + AI processing)
  // Minimum 4 exchanges, maximum 20 exchanges
  const calculateEstimatedTime = (themeCount: number): number => {
    if (themeCount === 0) return 0;
    
    // Base time calculation based on theme exploration:
    // - Minimum: 4 exchanges × 1 min = 4 minutes
    // - Target: Enough exchanges to cover themes with depth
    // - For 1-2 themes: 4-6 exchanges (4-6 min)
    // - For 3-4 themes: 6-10 exchanges (6-10 min) 
    // - For 5-6 themes: 8-12 exchanges (8-12 min)
    // - For 7+ themes: 10-15 exchanges (10-15 min)
    
    if (themeCount === 1) return 5;
    if (themeCount === 2) return 6;
    if (themeCount === 3) return 8;
    if (themeCount === 4) return 9;
    if (themeCount === 5) return 10;
    if (themeCount === 6) return 11;
    // For 7+ themes, cap at reasonable maximum
    return Math.min(15, 5 + Math.round(themeCount * 1.2));
  };
  
  const estimatedMinutes = calculateEstimatedTime(selectedThemes.length);
  
  // Calculate time range for display (shows variability)
  // Range accounts for:
  // - User response speed (fast vs thoughtful)
  // - Theme exploration depth (light touch vs thorough)
  // - Natural conversation flow variations
  const minMinutes = Math.max(4, estimatedMinutes - 2);
  const maxMinutes = Math.min(estimatedMinutes + 3, 18);
  const showRange = selectedThemes.length >= 1;

  const participantLabel = surveyType === 'course_evaluation' ? 'students' : 'employees';
  const conversationLabel = surveyType === 'course_evaluation' ? 'evaluation' : 'conversation';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {surveyType === 'course_evaluation' ? 'Select Evaluation Dimensions' : 'Select Conversation Themes'}
        </h2>
        <p className="text-muted-foreground mt-1">
          Choose the topics the AI will explore with {participantLabel}
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          Estimated {conversationLabel} time: <strong>
            {showRange ? `${minMinutes}-${maxMinutes} minutes` : `${estimatedMinutes} minutes`}
          </strong>
          {selectedThemes.length >= 1 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 ml-1 inline cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    The AI adaptively explores themes like a proper interview. Conversations complete when themes are adequately covered (typically 60%+ coverage with depth, or 80%+ coverage). Time varies based on how much participants want to share.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </span>
      </div>

      <FormField
        control={form.control}
        name="themes"
        render={() => (
          <FormItem>
            <div className="flex items-center gap-2">
              <FormLabel>Themes *</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      {surveyType === 'course_evaluation'
                        ? 'Dimensions help organize student feedback into categories like Learning Outcomes, Instructor Effectiveness, Course Design, etc. The AI will explore each selected dimension conversationally.'
                        : 'Themes help organize employee feedback into categories like Work-Life Balance, Leadership, Career Development, etc. The AI will explore each selected theme conversationally.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FormDescription>
              Select at least one {surveyType === 'course_evaluation' ? 'dimension' : 'theme'} to include in the {surveyType === 'course_evaluation' ? 'evaluation' : 'survey'}
            </FormDescription>
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

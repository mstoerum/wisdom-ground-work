import { UseFormReturn } from "react-hook-form";
import { SurveyFormData } from "@/lib/surveySchema";
import { FormControl, FormDescription, FormField, FormItem } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Users, GraduationCap, Building2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SurveyTypeSelectorProps {
  form: UseFormReturn<SurveyFormData>;
}

export const SurveyTypeSelector = ({ form }: SurveyTypeSelectorProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Survey Type</h2>
        <p className="text-muted-foreground mt-1">
          Select the type of feedback you want to collect
        </p>
      </div>

      <FormField
        control={form.control}
        name="survey_type"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Employee Satisfaction Survey */}
                <div className="relative">
                  <RadioGroupItem 
                    value="employee_satisfaction" 
                    id="employee_satisfaction" 
                    className="sr-only" 
                  />
                  <label htmlFor="employee_satisfaction" className="cursor-pointer block">
                    <Card className={cn(
                      "transition-all hover:border-primary/50 h-full",
                      field.value === 'employee_satisfaction' && "border-primary ring-2 ring-primary/20"
                    )}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Employee Satisfaction</CardTitle>
                            <CardDescription className="text-xs">Workplace feedback</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Gather honest employee feedback on workplace culture, leadership, work-life balance, and more.
                        </p>
                        <div className="space-y-2">
                          <p className="text-xs font-medium">Typical themes:</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                              <Users className="h-3 w-3" />
                              Work-Life Balance
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                              <Users className="h-3 w-3" />
                              Leadership
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                              <Users className="h-3 w-3" />
                              Career Development
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <strong>Best for:</strong> HR professionals, managers, people teams
                        </p>
                      </CardContent>
                    </Card>
                  </label>
                </div>

                {/* Course Evaluation */}
                <div className="relative">
                  <RadioGroupItem 
                    value="course_evaluation" 
                    id="course_evaluation" 
                    className="sr-only" 
                  />
                  <label htmlFor="course_evaluation" className="cursor-pointer block">
                    <Card className={cn(
                      "transition-all hover:border-primary/50 h-full",
                      field.value === 'course_evaluation' && "border-primary ring-2 ring-primary/20"
                    )}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Course Evaluation</CardTitle>
                            <CardDescription className="text-xs">Academic feedback</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Collect rich, qualitative student feedback on teaching quality, course design, and learning outcomes.
                        </p>
                        <div className="space-y-2">
                          <p className="text-xs font-medium">Evaluation dimensions:</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                              <BookOpen className="h-3 w-3" />
                              Learning & Achievement
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                              <BookOpen className="h-3 w-3" />
                              Instructor Effectiveness
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                              <BookOpen className="h-3 w-3" />
                              Course Design
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <strong>Best for:</strong> Professors, instructors, academic departments
                        </p>
                      </CardContent>
                    </Card>
                  </label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormDescription>
              You can create multiple surveys of different types
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};

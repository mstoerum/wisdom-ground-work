import { UseFormReturn } from "react-hook-form";
import { SurveyFormData } from "@/lib/surveySchema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { useContextualTerms } from "@/lib/contextualTerminology";

interface SurveyDetailsProps {
  form: UseFormReturn<SurveyFormData>;
}

export const SurveyDetails = ({ form }: SurveyDetailsProps) => {
  const surveyType = form.watch("survey_type");
  const terms = useContextualTerms(surveyType);
  
  // Auto-generate first message based on survey type
  const firstMessage = surveyType === 'course_evaluation'
    ? "Hi, I'm Spradley, an AI here to learn about your course experience."
    : "Hello! I'm here to listen and learn from your experience.";

  const getPlaceholderTitle = () => {
    return surveyType === "course_evaluation" ? "PSYCH 101 Fall 2024 Evaluation" : "Q1 2025 Employee Feedback";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Survey Details</h2>
        <p className="text-muted-foreground mt-1">Set the basic information for your {terms.feedback} survey</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Survey Title *</FormLabel>
              <FormControl><Input placeholder={getPlaceholderTitle()} {...field} /></FormControl>
              <FormDescription>A clear, descriptive title for internal reference</FormDescription>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl><Textarea placeholder={surveyType === "course_evaluation" ? "This evaluation focuses on learning outcomes..." : "This survey focuses on employee wellbeing..."} {...field} rows={3} /></FormControl>
              <FormDescription>Internal notes about this survey's purpose</FormDescription>
              <FormMessage />
            </FormItem>
          )} />

          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-sm font-medium mb-2">✨ Auto-Generated Opening</p>
            <p className="text-sm text-muted-foreground">
              The AI will automatically introduce itself based on the themes you select. 
              {surveyType === 'course_evaluation' 
                ? " For course evaluations, it uses a student-friendly, conversational approach."
                : " For employee surveys, it uses a professional, empathetic tone."}
            </p>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><MessageCircle className="h-5 w-5" />{terms.Participant} Preview</CardTitle>
              <CardDescription>How {terms.participants} will see the conversation start</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-card rounded-lg p-3 max-w-[80%] border">
                    <p className="text-sm">{firstMessage || (surveyType === "course_evaluation" ? "Hi! I'd love to hear about your learning experience." : "Hi! I'm here to listen.")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

import { UseFormReturn } from "react-hook-form";
import { SurveyFormData } from "@/lib/surveySchema";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

interface SurveyDetailsProps {
  form: UseFormReturn<SurveyFormData>;
}

export const SurveyDetails = ({ form }: SurveyDetailsProps) => {
  const firstMessage = form.watch("first_message");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Survey Details</h2>
        <p className="text-muted-foreground mt-1">
          Set the basic information for your feedback survey
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Survey Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Q1 2025 Employee Feedback" {...field} />
                </FormControl>
                <FormDescription>
                  A clear, descriptive title for internal reference
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="This survey focuses on employee wellbeing and engagement..."
                    {...field}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>Internal notes about this survey's purpose</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="first_message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Message *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Hi! I'm here to listen. How are you feeling about work today?"
                    {...field}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>
                  The AI's first message to employees (sets the tone)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Employee Preview
              </CardTitle>
              <CardDescription>How employees will see the conversation start</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-card rounded-lg p-3 max-w-[80%] border">
                    <p className="text-sm">{firstMessage || "Hi! I'm here to listen. How are you feeling about work today?"}</p>
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

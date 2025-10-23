import { UseFormReturn } from "react-hook-form";
import { SurveyFormData } from "@/lib/surveySchema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ConsentSettingsProps {
  form: UseFormReturn<SurveyFormData>;
}

export const ConsentSettings = ({ form }: ConsentSettingsProps) => {
  const anonymizationLevel = form.watch("anonymization_level");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Consent & Privacy</h2>
        <p className="text-muted-foreground mt-1">
          Configure privacy settings and employee consent requirements
        </p>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Privacy-First Design</p>
              <p className="text-sm text-muted-foreground">
                All surveys require explicit employee consent. Data is encrypted and handled according to GDPR standards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <FormField
        control={form.control}
        name="anonymization_level"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel>Response Anonymization *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="space-y-3"
              >
                <div className="flex items-start space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="identified" id="identified" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="identified" className="font-medium cursor-pointer">
                      Identified (Default)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Responses are linked to employee profiles. Allows for personalized follow-up and demographic analysis.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 p-4 border rounded-lg">
                  <RadioGroupItem value="anonymous" id="anonymous" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="anonymous" className="font-medium cursor-pointer">
                      Anonymous
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Responses use anonymous tokens. No way to trace back to individual employees. Use for sensitive topics.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {anonymizationLevel === 'anonymous' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Anonymous mode prevents follow-up actions and demographic filtering. You'll still see aggregated insights and themes.
          </AlertDescription>
        </Alert>
      )}

      <FormField
        control={form.control}
        name="consent_message"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Consent Message *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Your responses help us create a better workplace..."
                {...field}
                rows={4}
              />
            </FormControl>
            <FormDescription>
              This message will be shown to employees before they start the survey
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="data_retention_days"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data Retention Period</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select retention period" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days (Recommended)</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              How long should we keep the survey responses before automatic deletion?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

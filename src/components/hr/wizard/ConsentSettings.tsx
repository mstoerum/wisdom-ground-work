import { UseFormReturn } from "react-hook-form";
import { SurveyFormData } from "@/lib/surveySchema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useContextualTerms } from "@/lib/contextualTerminology";

interface ConsentSettingsProps {
  form: UseFormReturn<SurveyFormData>;
}

export const ConsentSettings = ({ form }: ConsentSettingsProps) => {
  const anonymizationLevel = form.watch("anonymization_level");
  const surveyType = form.watch("survey_type");
  const terms = useContextualTerms(surveyType);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Consent & Privacy</h2>
        <p className="text-muted-foreground mt-1">
          {terms.consentDescription}
        </p>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Privacy-First Design</p>
              <p className="text-sm text-muted-foreground">
                {terms.privacyMessage}
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
            <div className="flex items-center gap-2">
              <FormLabel>{terms.responseLabel} *</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Fully anonymous surveys don't store any {terms.participant} identifiers, protecting complete confidentiality. Identified surveys allow follow-up on urgent issues but link responses to {terms.participant} profiles.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
                      {terms.identifiedDescription}
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
                      {terms.anonymousDescription}
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
            <div className="flex items-center gap-2">
              <FormLabel>Consent Message *</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Clear consent builds trust with employees. Explain what data you'll collect, how it will be used, and how their privacy is protected.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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

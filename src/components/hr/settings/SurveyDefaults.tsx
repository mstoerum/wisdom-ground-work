import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

export const SurveyDefaults = () => {
  const queryClient = useQueryClient();
  const [consentMessage, setConsentMessage] = useState('');
  const [anonymizationLevel, setAnonymizationLevel] = useState('anonymous');
  const [firstMessage, setFirstMessage] = useState('');
  const [retentionDays, setRetentionDays] = useState('60');

  // Fetch existing defaults
  const { data: defaults, isLoading } = useQuery({
    queryKey: ['survey-defaults'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_defaults')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Initialize form values
  useEffect(() => {
    if (defaults) {
      setConsentMessage(defaults.consent_message);
      setAnonymizationLevel(defaults.anonymization_level);
      setFirstMessage(defaults.first_message);
      setRetentionDays(defaults.data_retention_days.toString());
    }
  }, [defaults]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const defaultsData = {
        consent_message: consentMessage,
        anonymization_level: anonymizationLevel,
        first_message: firstMessage,
        data_retention_days: parseInt(retentionDays),
        updated_by: user.id,
      };

      if (defaults?.id) {
        const { error } = await supabase
          .from('survey_defaults')
          .update(defaultsData)
          .eq('id', defaults.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('survey_defaults')
          .insert({
            ...defaultsData,
            created_by: user.id,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-defaults'] });
      toast.success('Survey defaults saved successfully');
    },
    onError: (error) => {
      console.error('Error saving defaults:', error);
      toast.error('Failed to save defaults');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Survey Defaults</CardTitle>
          <CardDescription>Configure default settings for new surveys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Survey Defaults</CardTitle>
        <CardDescription>
          Configure default settings for new surveys. These will be pre-filled when creating new surveys.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="consent-template">Default Consent Message</Label>
          <Textarea
            id="consent-template"
            placeholder="Your responses will be kept confidential..."
            rows={4}
            value={consentMessage}
            onChange={(e) => setConsentMessage(e.target.value)}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {consentMessage.length}/500 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="anonymization">Default Anonymization Level</Label>
          <Select value={anonymizationLevel} onValueChange={setAnonymizationLevel}>
            <SelectTrigger id="anonymization">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="identified">Identified</SelectItem>
              <SelectItem value="anonymous">Anonymous</SelectItem>
              <SelectItem value="pseudonymous">Pseudonymous</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="greeting">Default First Message</Label>
          <Textarea
            id="greeting"
            placeholder="Hello! Thank you for taking the time to share your feedback..."
            rows={3}
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            maxLength={300}
          />
          <p className="text-xs text-muted-foreground">
            {firstMessage.length}/300 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="retention">Data Retention (Days)</Label>
          <Input
            id="retention"
            type="number"
            min="30"
            max="365"
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            How long to keep survey responses (30-365 days)
          </p>
        </div>

        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Defaults'}
        </Button>
      </CardContent>
    </Card>
  );
};

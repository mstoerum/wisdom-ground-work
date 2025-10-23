import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const SurveyDefaults = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Survey Defaults</CardTitle>
        <CardDescription>
          Configure default settings for new surveys
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="consent-template">Default Consent Message</Label>
          <Textarea
            id="consent-template"
            placeholder="Your responses will be kept confidential..."
            rows={4}
            defaultValue="Your responses will be kept confidential and used to improve our workplace. We take your privacy seriously and follow strict data protection guidelines."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="anonymization">Default Anonymization Level</Label>
          <Select defaultValue="anonymous">
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
            defaultValue="Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone."
          />
        </div>

        <Button disabled>
          Save Defaults (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
};

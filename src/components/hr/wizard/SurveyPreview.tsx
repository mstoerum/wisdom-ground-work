import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConversationBubble } from "@/components/employee/ConversationBubble";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SurveyPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyData: {
    title: string;
    first_message?: string;
    themes?: string[];
    consent_config?: {
      anonymization_level?: string;
      data_retention_days?: number;
      consent_message?: string;
    };
  };
}

export const SurveyPreview = ({ open, onOpenChange, surveyData }: SurveyPreviewProps) => {
  const { title, first_message, themes, consent_config } = surveyData;

  // Fetch theme details
  const { data: themeDetails = [] } = useQuery({
    queryKey: ['theme-details', themes],
    queryFn: async () => {
      if (!themes || themes.length === 0) return [];
      const { data, error } = await supabase
        .from('survey_themes')
        .select('id, name')
        .in('id', themes);
      if (error) throw error;
      return data;
    },
    enabled: !!themes && themes.length > 0,
  });

  // Generate mock conversation based on themes
  const mockConversation = [
    {
      role: "assistant" as const,
      content: first_message || "Hello! Thank you for taking the time to share your feedback with us.",
    },
    {
      role: "user" as const,
      content: "I'm happy to share my thoughts.",
    },
    ...themeDetails.slice(0, 2).flatMap((theme) => [
      {
        role: "assistant" as const,
        content: `I'd like to understand more about ${theme.name}. How do you feel about this aspect of your work?`,
      },
      {
        role: "user" as const,
        content: `I have some thoughts about ${theme.name.toLowerCase()}...`,
      },
    ]),
    {
      role: "assistant" as const,
      content: "Thank you for sharing all of that. Before we finish, is there anything else you'd like to add?",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview: {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Privacy Settings Preview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm">Privacy Settings</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {consent_config?.anonymization_level === "anonymous" ? "Fully Anonymous" : "Identified"}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Data kept for {consent_config?.data_retention_days || 60} days
              </Badge>
            </div>
            {consent_config?.consent_message && (
              <p className="text-sm text-muted-foreground mt-2">{consent_config.consent_message}</p>
            )}
          </div>

          {/* Mock Conversation */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Conversation Preview</h3>
            <ScrollArea className="h-[400px] rounded-lg border bg-background p-4">
              <div className="space-y-4">
                {mockConversation.map((message, index) => (
                  <ConversationBubble
                    key={index}
                    message={message.content}
                    isUser={message.role === "user"}
                    timestamp={new Date()}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Themes Preview */}
          {themeDetails.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Covered Themes</h3>
              <div className="flex flex-wrap gap-2">
                {themeDetails.map((theme) => (
                  <Badge key={theme.id} variant="secondary">
                    {theme.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
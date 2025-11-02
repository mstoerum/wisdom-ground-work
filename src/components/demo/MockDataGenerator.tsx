import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, CheckCircle2, AlertCircle } from "lucide-react";
import { insertMockConversations } from "@/utils/generateMockConversations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDemoAuth } from "@/hooks/useDemoAuth";

interface MockDataGeneratorProps {
  surveyId?: string;
  onDataGenerated?: () => void;
}

export function MockDataGenerator({ surveyId = 'demo-survey-001', onDataGenerated }: MockDataGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStats, setGeneratedStats] = useState<{ sessionsCreated: number; responsesCreated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { createDemoUser, isLoading: isCreatingDemoUser } = useDemoAuth();

  const ensureAuthenticated = async (): Promise<boolean> => {
    // Check if user is already authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!userError && user) {
      return true;
    }

    // User is not authenticated, create a demo HR user
    toast.info('Setting up demo session...');
    const demoUser = await createDemoUser('hr');
    
    if (!demoUser) {
      throw new Error('Failed to create demo user. Please try again.');
    }

    // Wait a moment for the session to be established
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify authentication was successful
    const { data: { user: verifyUser }, error: verifyError } = await supabase.auth.getUser();
    
    if (verifyError || !verifyUser) {
      throw new Error('Authentication setup failed. Please refresh the page and try again.');
    }

    return true;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Ensure user is authenticated before generating mock data
      await ensureAuthenticated();
      
      const stats = await insertMockConversations(surveyId);
      setGeneratedStats(stats);
      toast.success(`Successfully generated ${stats.sessionsCreated} conversations with ${stats.responsesCreated} responses!`);
      onDataGenerated?.();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to generate mock data';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error generating mock data:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Mock Data Generator
            </CardTitle>
            <CardDescription className="mt-1">
              Generate 45 realistic employee conversations to test HR analytics with substantial data
            </CardDescription>
          </div>
          {generatedStats && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Generated
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Creates 45 conversation sessions with varied sentiment and themes</p>
          <p>• Generates 3-8 responses per conversation (150-360 total responses)</p>
          <p>• Includes realistic mood tracking, AI responses, and sentiment analysis</p>
          <p>• Covers all demo survey themes: Work-Life Balance, Team Collaboration, Career Development, Management Support, Workplace Culture</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm text-destructive">
              <p className="font-medium">Error generating data</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {generatedStats && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900 dark:text-green-100">Data Generated Successfully</span>
            </div>
            <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <p>• {generatedStats.sessionsCreated} conversation sessions created</p>
              <p>• {generatedStats.responsesCreated} responses generated</p>
              <p className="mt-2 text-xs">The analytics dashboard will now use this real conversation data instead of mock data.</p>
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || isCreatingDemoUser || !!generatedStats}
          className="w-full"
          size="lg"
        >
          {isGenerating || isCreatingDemoUser ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isCreatingDemoUser ? 'Setting up demo session...' : 'Generating Mock Data...'}
            </>
          ) : generatedStats ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Data Already Generated
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Generate 45 Mock Conversations
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

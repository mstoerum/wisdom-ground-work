import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { insertMockConversations } from "@/utils/generateMockConversations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDemoAuth } from "@/hooks/useDemoAuth";
import { useQueryClient } from "@tanstack/react-query";

interface MockDataGeneratorProps {
  surveyId?: string;
  onDataGenerated?: () => void;
}

export function MockDataGenerator({ surveyId = 'demo-survey-001', onDataGenerated }: MockDataGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [generatedStats, setGeneratedStats] = useState<{ sessionsCreated: number; responsesCreated: number } | null>(null);
  const [totalGenerated, setTotalGenerated] = useState({ sessions: 0, responses: 0 });
  const [error, setError] = useState<string | null>(null);
  const { createDemoUser, isLoading: isCreatingDemoUser } = useDemoAuth();
  const queryClient = useQueryClient();

  // Check for existing data on mount
  useEffect(() => {
    const checkExistingData = async () => {
      try {
        const DEMO_SURVEY_UUID = '00000000-0000-0000-0000-000000000001';
        const targetSurveyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(surveyId) 
          ? surveyId 
          : DEMO_SURVEY_UUID;

        // Count existing sessions and responses
        const { count: sessionCount } = await supabase
          .from('conversation_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('survey_id', targetSurveyId);

        const { count: responseCount } = await supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .eq('survey_id', targetSurveyId);

        if (sessionCount && sessionCount > 0) {
          setTotalGenerated({
            sessions: sessionCount || 0,
            responses: responseCount || 0
          });
        }
      } catch (error) {
        console.warn('Could not check for existing data:', error);
        // Silently fail - user can still generate data
      }
    };

    checkExistingData();
  }, [surveyId]);

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

  const handleClearData = async () => {
    setIsClearing(true);
    setError(null);
    
    try {
      // Get demo survey UUID
      const DEMO_SURVEY_UUID = '00000000-0000-0000-0000-000000000001';
      const targetSurveyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(surveyId) 
        ? surveyId 
        : DEMO_SURVEY_UUID;
      
      // Delete responses first (due to foreign key constraints)
      const { error: responsesError } = await supabase
        .from('responses')
        .delete()
        .eq('survey_id', targetSurveyId);
      
      if (responsesError) {
        throw new Error(`Failed to delete responses: ${responsesError.message}`);
      }
      
      // Delete conversation sessions
      const { error: sessionsError } = await supabase
        .from('conversation_sessions')
        .delete()
        .eq('survey_id', targetSurveyId);
      
      if (sessionsError) {
        throw new Error(`Failed to delete sessions: ${sessionsError.message}`);
      }
      
      // Reset counters
      setTotalGenerated({ sessions: 0, responses: 0 });
      setGeneratedStats(null);
      
      toast.success("All mock data cleared successfully!");
      
      // Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key)) return false;
          const firstKey = key[0];
          return (
            firstKey === 'conversation-responses' ||
            firstKey === 'conversation-sessions' ||
            firstKey === 'enhanced-analytics' ||
            firstKey === 'survey-themes' ||
            firstKey === 'analytics-participation' ||
            firstKey === 'analytics-sentiment' ||
            firstKey === 'analytics-themes' ||
            firstKey === 'analytics-urgency' ||
            firstKey === 'department-data' ||
            firstKey === 'demo-department-data' ||
            firstKey === 'time-series-data' ||
            firstKey === 'surveys-list'
          );
        }
      });
      
      onDataGenerated?.();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to clear mock data';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error clearing mock data:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Ensure user is authenticated before generating mock data
      await ensureAuthenticated();
      
      // Clear old demo data first if it exists
      if (totalGenerated.sessions > 0) {
        toast.info("Clearing old demo data...");
        
        const DEMO_SURVEY_UUID = '00000000-0000-0000-0000-000000000001';
        const targetSurveyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(surveyId) 
          ? surveyId 
          : DEMO_SURVEY_UUID;
        
        // Delete responses first (due to foreign key constraints)
        await supabase.from('responses').delete().eq('survey_id', targetSurveyId);
        
        // Delete conversation sessions
        await supabase.from('conversation_sessions').delete().eq('survey_id', targetSurveyId);
      }
      
      const stats = await insertMockConversations(surveyId);
      setGeneratedStats(stats);
      setTotalGenerated({
        sessions: stats.sessionsCreated,
        responses: stats.responsesCreated
      });
      toast.success(`Successfully generated ${stats.sessionsCreated} conversations with ${stats.responsesCreated} responses!`);
      
      // Clear the success message after 5 seconds to indicate button is ready again
      setTimeout(() => {
        setGeneratedStats(null);
      }, 5000);
      
      // Invalidate all analytics-related queries to ensure fresh data is fetched
      toast.info("Refreshing analytics with new data...");
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key)) return false;
          const firstKey = key[0];
          return (
            firstKey === 'conversation-responses' ||
            firstKey === 'conversation-sessions' ||
            firstKey === 'enhanced-analytics' ||
            firstKey === 'survey-themes' ||
            firstKey === 'analytics-participation' ||
            firstKey === 'analytics-sentiment' ||
            firstKey === 'analytics-themes' ||
            firstKey === 'analytics-urgency' ||
            firstKey === 'department-data' ||
            firstKey === 'time-series-data' ||
            firstKey === 'surveys-list'
          );
        }
      });
      
      // Wait a moment for invalidation to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Call the callback which will handle refetching
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
              {totalGenerated.sessions > 0 
                ? `Regenerate fresh mock data (will replace current ${totalGenerated.sessions} sessions with new data)`
                : 'Generate 45 realistic employee conversations to test HR analytics with substantial data'
              }
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
          <p>? Creates 45 conversation sessions with varied sentiment and themes</p>
          <p>? Generates 3-8 responses per conversation (150-360 total responses)</p>
          <p>? Includes realistic mood tracking, AI responses, and sentiment analysis</p>
          <p>? Covers all demo survey themes: Work-Life Balance, Team Collaboration, Career Development, Management Support, Workplace Culture</p>
          {totalGenerated.sessions > 0 && (
            <p className="text-amber-600 dark:text-amber-400 font-medium pt-2">
              ?? Note: Generating new data will automatically clear existing demo data first.
            </p>
          )}
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
              <span className="font-medium text-green-900 dark:text-green-100">Latest Generation Successful</span>
            </div>
            <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <p>? {generatedStats.sessionsCreated} conversation sessions created</p>
              <p>? {generatedStats.responsesCreated} responses generated</p>
              <p className="mt-2 text-xs">Watch the analytics below update in real-time with the new data!</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isCreatingDemoUser || isClearing}
            className="flex-1"
            size="lg"
          >
            {isGenerating || isCreatingDemoUser ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isCreatingDemoUser ? 'Setting up demo session...' : 'Generating Mock Data...'}
              </>
            ) : totalGenerated.sessions > 0 ? (
              <>
                <Database className="h-4 w-4 mr-2" />
                Regenerate Fresh Data (45 Conversations)
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Generate 45 Mock Conversations
              </>
            )}
          </Button>
          
          {totalGenerated.sessions > 0 && (
            <Button
              onClick={handleClearData}
              disabled={isGenerating || isCreatingDemoUser || isClearing}
              variant="outline"
              size="lg"
              className="border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              {isClearing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

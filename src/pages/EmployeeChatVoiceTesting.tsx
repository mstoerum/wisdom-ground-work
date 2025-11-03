import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TestingSessionManager } from '@/components/testing/TestingSessionManager';
import { TestingQuestionnaire } from '@/components/testing/TestingQuestionnaire';
import { EmployeeSurveyFlow } from '@/components/employee/EmployeeSurveyFlow';
import { ChatInterface } from '@/components/employee/ChatInterface';
import { VoiceInterface } from '@/components/employee/VoiceInterface';
import { useTestingInteractionTracker } from '@/hooks/useTestingAnalytics';
import { useConversation } from '@/hooks/useConversation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  MessageSquare, 
  Mic, 
  CheckCircle2,
  Info,
  ArrowRight
} from 'lucide-react';

type TestingStep = 
  | 'setup' 
  | 'pre_questionnaire' 
  | 'traditional_survey' 
  | 'chat' 
  | 'voice' 
  | 'comparison_questionnaire' 
  | 'final_reflection' 
  | 'complete';

const PERSONAS = [
  { id: 'maria_chen', label: 'Maria Chen - Senior Software Engineer (Large Corp)' },
  { id: 'james_mitchell', label: 'James Mitchell - Sales Manager (Large Corp)' },
  { id: 'priya_sharma', label: 'Priya Sharma - Junior HR Coordinator (Large Corp)' },
  { id: 'alex_rivera', label: 'Alex Rivera - Co-founder/PM (Startup)' },
  { id: 'jordan_kim', label: 'Jordan Kim - Junior Developer (Startup)' },
  { id: 'sam_taylor', label: 'Sam Taylor - Operations Lead (Startup)' },
  { id: 'fatima_almahmoud', label: 'Fatima Al-Mahmoud - Program Coordinator (NGO)' },
  { id: 'marcus_johnson', label: 'Marcus Johnson - Development Director (NGO)' },
  { id: 'aisha_patel', label: 'Aisha Patel - Field Coordinator (NGO)' },
  { id: 'david_obrien', label: 'David O\'Brien - Administrative Officer (Public Sector)' },
  { id: 'lisa_anderson', label: 'Lisa Anderson - Policy Analyst (Public Sector)' },
  { id: 'roberto_silva', label: 'Roberto Silva - Social Worker (Public Sector)' },
];

const ORG_TYPES: Record<string, string> = {
  maria_chen: 'large_corp',
  james_mitchell: 'large_corp',
  priya_sharma: 'large_corp',
  alex_rivera: 'startup',
  jordan_kim: 'startup',
  sam_taylor: 'startup',
  fatima_almahmoud: 'ngo',
  marcus_johnson: 'ngo',
  aisha_patel: 'ngo',
  david_obrien: 'public_sector',
  lisa_anderson: 'public_sector',
  roberto_silva: 'public_sector',
};

export const EmployeeChatVoiceTesting = () => {
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<TestingStep>('setup');
  const [currentMethod, setCurrentMethod] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [completedMethods, setCompletedMethods] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { startConversation, endConversation } = useConversation();
  const tracker = useTestingInteractionTracker(
    sessionId || '',
    currentMethod || ''
  );

  // Get or create a test survey for traditional survey testing
  const [testSurveyId, setTestSurveyId] = useState<string | null>(null);

  useEffect(() => {
    // Create a test survey if needed
    const createTestSurvey = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if test survey exists
      const { data: existing } = await supabase
        .from('surveys')
        .select('id')
        .eq('title', 'Testing - Traditional Survey')
        .eq('created_by', user.id)
        .limit(1)
        .single();

      if (existing) {
        setTestSurveyId(existing.id);
        return;
      }

      // Create test survey
      const { data: newSurvey, error } = await supabase
        .from('surveys')
        .insert({
          title: 'Testing - Traditional Survey',
          description: 'This is a test survey for comparison purposes',
          created_by: user.id,
          status: 'active',
          first_message: 'Welcome to the traditional survey test. Please answer the following questions.',
          consent_config: {
            anonymization_level: 'anonymous',
            data_retention_days: 30,
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating test survey:', error);
      } else {
        setTestSurveyId(newSurvey.id);
      }
    };

    createTestSurvey();
  }, []);

  const handleSessionStart = (newSessionId: string) => {
    setSessionId(newSessionId);
    setCurrentStep('pre_questionnaire');
  };

  const handlePreQuestionnaireComplete = () => {
    // Start with traditional survey
    setCurrentMethod('traditional_survey');
    setCurrentStep('traditional_survey');
    tracker.mutate({
      startedAt: new Date(),
      deviceType: /Mobile|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: navigator.userAgent,
      location: 'testing',
    });
  };

  const handleMethodComplete = async () => {
    if (!sessionId || !currentMethod) return;

    // Mark method as completed
    setCompletedMethods(prev => new Set([...prev, currentMethod]));

    // Update interaction
    await tracker.mutateAsync({
      completedAt: new Date(),
      completed: true,
    });

    // Determine next method
    const methods = ['traditional_survey', 'chat', 'voice'];
    const currentIndex = methods.indexOf(currentMethod);
    
    if (currentIndex < methods.length - 1) {
      // Move to next method
      const nextMethod = methods[currentIndex + 1];
      
      // Show post-questionnaire for current method
      setCurrentStep('post_questionnaire');
    } else {
      // All methods done, show comparison questionnaire
      setCurrentStep('comparison_questionnaire');
    }
  };

  const handlePostQuestionnaireComplete = () => {
    const methods = ['traditional_survey', 'chat', 'voice'];
    const currentIndex = methods.indexOf(currentMethod || '');
    
    if (currentIndex < methods.length - 1) {
      const nextMethod = methods[currentIndex + 1];
      startNextMethod(nextMethod);
    }
  };

  const startNextMethod = async (method: string) => {
    setCurrentMethod(method);
    
    if (method === 'traditional_survey') {
      setCurrentStep('traditional_survey');
      tracker.mutate({
        startedAt: new Date(),
        deviceType: /Mobile|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        browser: navigator.userAgent,
        location: 'testing',
      });
    } else if (method === 'chat') {
      // Start chat conversation
      if (testSurveyId) {
        const newConversationId = await startConversation(testSurveyId, 50);
        if (newConversationId) {
          setConversationId(newConversationId);
          setCurrentStep('chat');
          tracker.mutate({
            startedAt: new Date(),
            conversationSessionId: newConversationId,
            deviceType: /Mobile|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            browser: navigator.userAgent,
            location: 'testing',
          });
        }
      }
    } else if (method === 'voice') {
      // Start voice conversation
      if (testSurveyId) {
        const newConversationId = await startConversation(testSurveyId, 50);
        if (newConversationId) {
          setConversationId(newConversationId);
          setCurrentStep('voice');
          tracker.mutate({
            startedAt: new Date(),
            conversationSessionId: newConversationId,
            deviceType: /Mobile|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            browser: navigator.userAgent,
            location: 'testing',
          });
        }
      }
    }
  };

  const handleComparisonComplete = () => {
    setCurrentStep('final_reflection');
  };

  const handleFinalReflectionComplete = async () => {
    // Mark session as complete
    if (sessionId) {
      await supabase
        .from('testing_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }

    setCurrentStep('complete');
    
    toast({
      title: 'Testing Complete!',
      description: 'Thank you for participating in our testing review.',
    });
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'traditional_survey':
        return FileText;
      case 'chat':
        return MessageSquare;
      case 'voice':
        return Mic;
      default:
        return FileText;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'traditional_survey':
        return 'Traditional Survey';
      case 'chat':
        return 'Chat Interface';
      case 'voice':
        return 'Voice Interface';
      default:
        return method;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Employee Chat & Voice Testing
          </h1>
          <p className="text-muted-foreground">
            Comprehensive review of chat and voice feedback systems
          </p>
        </div>

        {/* Setup Step */}
        {currentStep === 'setup' && (
          <Card className="p-6 max-w-2xl mx-auto">
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Select a persona to begin testing. This will guide you through traditional surveys, 
                  chat, and voice interfaces for comparison.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Persona</label>
                <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a persona to test..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONAS.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        {persona.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPersona && (
                <div className="pt-4">
                  <TestingSessionManager
                    personaId={selectedPersona}
                    organizationType={ORG_TYPES[selectedPersona]}
                    onSessionStart={handleSessionStart}
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Pre-Questionnaire */}
        {currentStep === 'pre_questionnaire' && sessionId && (
          <TestingQuestionnaire
            sessionId={sessionId}
            questionnaireType="pre_interaction"
            onComplete={handlePreQuestionnaireComplete}
            onBack={() => setCurrentStep('setup')}
          />
        )}

        {/* Traditional Survey */}
        {currentStep === 'traditional_survey' && testSurveyId && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Traditional Survey</h2>
                </div>
                <Badge>Method 1 of 3</Badge>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Complete this traditional survey. This will be compared with chat and voice methods.
                </AlertDescription>
              </Alert>

              <div className="min-h-[400px]">
                <EmployeeSurveyFlow
                  surveyId={testSurveyId}
                  surveyDetails={{
                    title: 'Testing - Traditional Survey',
                    consent_config: {
                      anonymization_level: 'anonymous',
                      data_retention_days: 30,
                    },
                  }}
                  onComplete={handleMethodComplete}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Chat Interface */}
        {currentStep === 'chat' && conversationId && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Chat Interface</h2>
                </div>
                <Badge>Method 2 of 3</Badge>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Have a conversation with Spradley using the chat interface. 
                  Share your workplace feedback naturally.
                </AlertDescription>
              </Alert>

              <ChatInterface
                conversationId={conversationId}
                onComplete={handleMethodComplete}
                onSaveAndExit={handleMethodComplete}
                showTrustFlow={false}
                skipTrustFlow={true}
              />
            </div>
          </Card>
        )}

        {/* Voice Interface */}
        {currentStep === 'voice' && conversationId && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mic className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Voice Interface</h2>
                </div>
                <Badge>Method 3 of 3</Badge>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Have a voice conversation with Spradley. Speak naturally about your workplace experiences.
                  Make sure you're in a quiet space with microphone access enabled.
                </AlertDescription>
              </Alert>

              <VoiceInterface
                conversationId={conversationId}
                onComplete={handleMethodComplete}
              />
            </div>
          </Card>
        )}

        {/* Post-Interaction Questionnaire */}
        {currentStep === 'post_questionnaire' && sessionId && currentMethod && (
          <TestingQuestionnaire
            sessionId={sessionId}
            questionnaireType="post_interaction"
            methodTested={currentMethod}
            onComplete={handlePostQuestionnaireComplete}
          />
        )}

        {/* Comparison Questionnaire */}
        {currentStep === 'comparison_questionnaire' && sessionId && (
          <TestingQuestionnaire
            sessionId={sessionId}
            questionnaireType="comparison"
            onComplete={handleComparisonComplete}
          />
        )}

        {/* Final Reflection */}
        {currentStep === 'final_reflection' && sessionId && (
          <TestingQuestionnaire
            sessionId={sessionId}
            questionnaireType="final_reflection"
            onComplete={handleFinalReflectionComplete}
          />
        )}

        {/* Complete */}
        {currentStep === 'complete' && (
          <Card className="p-12 text-center max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-6">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold">Testing Complete!</h2>
              <p className="text-lg text-muted-foreground">
                Thank you for participating in our comprehensive review. Your feedback helps us improve 
                the chat and voice feedback experience for all employees.
              </p>
              <div className="pt-6">
                <Button onClick={() => window.location.reload()}>
                  Start New Test Session
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

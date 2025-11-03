import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, 
  Circle, 
  User, 
  Building2, 
  Clock,
  Play,
  FileText,
  MessageSquare,
  Mic
} from 'lucide-react';

interface TestingSession {
  id: string;
  persona_id: string;
  organization_type: string;
  status: string;
  test_sequence: string[];
  created_at: string;
  completed_at?: string;
}

interface TestingSessionManagerProps {
  personaId: string;
  organizationType: string;
  onSessionStart: (sessionId: string) => void;
}

const PERSONA_CONFIG = {
  maria_chen: { name: 'Maria Chen', org: 'Large International Corp', role: 'Senior Software Engineer' },
  james_mitchell: { name: 'James Mitchell', org: 'Large International Corp', role: 'Sales Manager' },
  priya_sharma: { name: 'Priya Sharma', org: 'Large International Corp', role: 'Junior HR Coordinator' },
  alex_rivera: { name: 'Alex Rivera', org: 'Small Startup', role: 'Co-founder/PM' },
  jordan_kim: { name: 'Jordan Kim', org: 'Small Startup', role: 'Junior Developer' },
  sam_taylor: { name: 'Sam Taylor', org: 'Small Startup', role: 'Operations Lead' },
  fatima_almahmoud: { name: 'Fatima Al-Mahmoud', org: 'NGO', role: 'Program Coordinator' },
  marcus_johnson: { name: 'Marcus Johnson', org: 'NGO', role: 'Development Director' },
  aisha_patel: { name: 'Aisha Patel', org: 'NGO', role: 'Field Coordinator' },
  david_obrien: { name: 'David O\'Brien', org: 'Public Sector', role: 'Administrative Officer' },
  lisa_anderson: { name: 'Lisa Anderson', org: 'Public Sector', role: 'Policy Analyst' },
  roberto_silva: { name: 'Roberto Silva', org: 'Public Sector', role: 'Social Worker' },
};

const METHOD_ICONS = {
  traditional_survey: FileText,
  chat: MessageSquare,
  voice: Mic,
};

export const TestingSessionManager = ({
  personaId,
  organizationType,
  onSessionStart,
}: TestingSessionManagerProps) => {
  const [session, setSession] = useState<TestingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const persona = PERSONA_CONFIG[personaId as keyof typeof PERSONA_CONFIG] || {
    name: personaId,
    org: organizationType,
    role: 'Employee'
  };

  // Load or create session
  useEffect(() => {
    loadOrCreateSession();
  }, [personaId, organizationType]);

  const loadOrCreateSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for existing in-progress session
      const { data: existing } = await supabase
        .from('testing_sessions')
        .select('*')
        .eq('persona_id', personaId)
        .eq('organization_type', organizationType)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        setSession(existing);
        return;
      }

      // Generate participant code
      const participantCode = `${personaId}_${Date.now()}`;

      // Create new session
      const { data: newSession, error } = await supabase
        .from('testing_sessions')
        .insert({
          persona_id: personaId,
          organization_type: organizationType,
          participant_code: participantCode,
          test_sequence: ['traditional_survey', 'chat', 'voice'],
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) throw error;
      setSession(newSession);
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize testing session',
        variant: 'destructive',
      });
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      traditional_survey: 'Traditional Survey',
      chat: 'Chat Interface',
      voice: 'Voice Interface',
    };
    return labels[method] || method;
  };

  const getCompletedMethods = (): string[] => {
    // This would be calculated from testing_interactions
    // For now, return empty array
    return [];
  };

  const completedMethods = getCompletedMethods();
  const currentMethod = session?.test_sequence[completedMethods.length] || null;
  const progress = session ? (completedMethods.length / session.test_sequence.length) * 100 : 0;

  if (!session) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Loading testing session...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      {/* Session Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">{persona.name}</h3>
              <p className="text-sm text-muted-foreground">{persona.role}</p>
            </div>
          </div>
          <Badge variant="outline">{persona.org}</Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>{organizationType.replace('_', ' ').toUpperCase()}</span>
          <span>?</span>
          <Clock className="h-4 w-4" />
          <span>Started {new Date(session.created_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Testing Progress</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Test Sequence */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Test Sequence</h4>
        {session.test_sequence.map((method, index) => {
          const isCompleted = completedMethods.includes(method);
          const isCurrent = method === currentMethod;
          const Icon = METHOD_ICONS[method as keyof typeof METHOD_ICONS] || Circle;

          return (
            <div
              key={method}
              className={`
                flex items-center gap-3 p-4 rounded-lg border transition-colors
                ${isCurrent ? 'border-primary bg-primary/5' : ''}
                ${isCompleted ? 'border-green-500/50 bg-green-500/5' : ''}
                ${!isCurrent && !isCompleted ? 'border-border bg-muted/30' : ''}
              `}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className={`h-5 w-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className={`flex-1 ${isCurrent ? 'font-medium' : ''}`}>
                {getMethodLabel(method)}
              </span>
              {isCurrent && (
                <Button
                  size="sm"
                  onClick={() => onSessionStart(session.id)}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Session Info */}
      <div className="pt-4 border-t text-xs text-muted-foreground">
        <p>Session ID: {session.id.slice(0, 8)}...</p>
        <p>Participant Code: {session.participant_code}</p>
      </div>
    </Card>
  );
};

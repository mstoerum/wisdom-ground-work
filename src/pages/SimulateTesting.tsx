import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { simulateTesting } from '@/utils/simulateTesting';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, CheckCircle2, Info } from 'lucide-react';

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

export const SimulateTesting = () => {
  const [selectedPersonas, setSelectedPersonas] = useState<Set<string>>(new Set(PERSONAS.map(p => p.id)));
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const { toast } = useToast();

  const handleTogglePersona = (personaId: string) => {
    setSelectedPersonas(prev => {
      const next = new Set(prev);
      if (next.has(personaId)) {
        next.delete(personaId);
      } else {
        next.add(personaId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedPersonas(new Set(PERSONAS.map(p => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedPersonas(new Set());
  };

  const handleRunSimulation = async () => {
    if (selectedPersonas.size === 0) {
      toast({
        title: 'No personas selected',
        description: 'Please select at least one persona to simulate.',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    setCompleted(false);
    setProgress('Starting simulation...');

    try {
      await simulateTesting(Array.from(selectedPersonas));
      
      setProgress(`Successfully simulated ${selectedPersonas.size} personas!`);
      setCompleted(true);
      
      toast({
        title: 'Simulation Complete!',
        description: `Generated test data for ${selectedPersonas.size} persona(s).`,
      });
    } catch (error) {
      console.error('Simulation error:', error);
      setProgress(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      toast({
        title: 'Simulation Failed',
        description: error instanceof Error ? error.message : 'An error occurred during simulation.',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Testing Simulation
          </h1>
          <p className="text-muted-foreground">
            Generate realistic test data for all personas
          </p>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This simulation will create complete testing sessions with realistic data for each selected persona.
            It includes pre-questionnaires, interactions for all three methods (survey, chat, voice), 
            post-questionnaires, comparisons, and final reflections.
          </AlertDescription>
        </Alert>

        {/* Persona Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Personas to Simulate</CardTitle>
                <CardDescription>
                  Choose which personas to generate test data for
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PERSONAS.map((persona) => (
                <div
                  key={persona.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={persona.id}
                    checked={selectedPersonas.has(persona.id)}
                    onCheckedChange={() => handleTogglePersona(persona.id)}
                    disabled={isRunning}
                  />
                  <Label
                    htmlFor={persona.id}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {persona.label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedPersonas.size} of {PERSONAS.length} personas selected
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Simulation Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Run Simulation</CardTitle>
            <CardDescription>
              Generate test data for the selected personas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress && (
              <Alert className={completed ? 'border-green-500' : ''}>
                {completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <AlertDescription>{progress}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleRunSimulation}
              disabled={isRunning || selectedPersonas.size === 0}
              className="w-full"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Simulation...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Simulation
                </>
              )}
            </Button>

            {completed && (
              <div className="pt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Simulation complete! You can now view the results in the analytics dashboard.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/hr/testing-analytics'}
                  >
                    View Analytics Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/test/chat-voice'}
                  >
                    Go to Testing Page
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What Gets Generated */}
        <Card>
          <CardHeader>
            <CardTitle>What Gets Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Testing session for each persona</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Pre-interaction questionnaire responses</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Three interaction records (survey, chat, voice) with realistic metrics</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Post-interaction questionnaires for each method</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Comparison questionnaire with preferences</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Final reflection questionnaire</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>All data reflects persona characteristics and preferences</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

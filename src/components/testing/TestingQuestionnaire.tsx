import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface QuestionnaireProps {
  sessionId: string;
  interactionId?: string;
  questionnaireType: 'pre_interaction' | 'post_interaction' | 'comparison' | 'final_reflection';
  methodTested?: string;
  onComplete: () => void;
  onBack?: () => void;
}

const QUESTIONNAIRES = {
  pre_interaction: {
    title: 'Pre-Interaction Questionnaire',
    description: 'A few quick questions before we begin',
    questions: [
      {
        id: 'tech_comfort',
        type: 'slider',
        label: 'How comfortable are you with AI chatbots?',
        min: 1,
        max: 5,
        marks: ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely'],
      },
      {
        id: 'previous_experience',
        type: 'radio',
        label: 'Have you used conversational AI for feedback before?',
        options: ['Yes', 'No'],
      },
      {
        id: 'primary_concerns',
        type: 'textarea',
        label: 'What are your primary concerns about workplace feedback?',
        placeholder: 'Share your thoughts...',
      },
      {
        id: 'preference',
        type: 'radio',
        label: 'Do you prefer speaking or typing for feedback?',
        options: ['Prefer speaking', 'Prefer typing', 'No preference'],
      },
    ],
  },
  post_interaction: {
    title: 'Post-Interaction Questionnaire',
    description: 'Tell us about your experience',
    questions: [
      {
        id: 'ease_of_use',
        type: 'slider',
        label: 'How easy was it to use this interface?',
        min: 1,
        max: 5,
        marks: ['Very difficult', 'Difficult', 'Neutral', 'Easy', 'Very easy'],
      },
      {
        id: 'comfort',
        type: 'slider',
        label: 'How comfortable did you feel expressing yourself?',
        min: 1,
        max: 5,
        marks: ['Very uncomfortable', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very comfortable'],
      },
      {
        id: 'trust',
        type: 'slider',
        label: 'How much do you trust that your feedback is anonymous?',
        min: 1,
        max: 5,
        marks: ['No trust', 'Low trust', 'Neutral', 'High trust', 'Complete trust'],
      },
      {
        id: 'privacy_confidence',
        type: 'slider',
        label: 'How confident are you about your privacy?',
        min: 1,
        max: 5,
        marks: ['Not confident', 'Slightly', 'Moderately', 'Very', 'Extremely'],
      },
      {
        id: 'depth',
        type: 'radio',
        label: 'Do you feel you were able to express yourself fully?',
        options: ['Yes', 'Somewhat', 'No'],
      },
      {
        id: 'depth_reasoning',
        type: 'textarea',
        label: 'Why or why not?',
        placeholder: 'Share your thoughts...',
        conditional: 'depth',
      },
      {
        id: 'time',
        type: 'radio',
        label: 'Did this feel like the right amount of time?',
        options: ['Too short', 'About right', 'Too long'],
      },
      {
        id: 'would_use_again',
        type: 'radio',
        label: 'Would you use this method again?',
        options: ['Yes', 'Maybe', 'No'],
      },
      {
        id: 'overall_thoughts',
        type: 'textarea',
        label: 'Any other thoughts about this experience?',
        placeholder: 'Share your reflections...',
      },
    ],
  },
  comparison: {
    title: 'Method Comparison',
    description: 'Compare the different methods you\'ve tried',
    questions: [
      {
        id: 'preference',
        type: 'radio',
        label: 'Which method did you prefer overall?',
        options: ['Traditional Survey', 'Chat Interface', 'Voice Interface'],
      },
      {
        id: 'preference_reasoning',
        type: 'textarea',
        label: 'Why did you prefer this method?',
        placeholder: 'Explain your preference...',
      },
      {
        id: 'time_comparison',
        type: 'radio',
        label: 'Which took longer?',
        options: ['Chat', 'Voice', 'Survey', 'Similar'],
      },
      {
        id: 'depth_comparison',
        type: 'radio',
        label: 'In which method did you express yourself more deeply?',
        options: ['Chat', 'Voice', 'Survey', 'Similar'],
      },
      {
        id: 'comfort_comparison',
        type: 'radio',
        label: 'Which felt most comfortable?',
        options: ['Chat', 'Voice', 'Survey', 'Similar'],
      },
      {
        id: 'honesty_comparison',
        type: 'radio',
        label: 'In which method were you most honest?',
        options: ['Chat', 'Voice', 'Survey', 'Similar'],
      },
      {
        id: 'engagement_comparison',
        type: 'radio',
        label: 'Which engaged you most?',
        options: ['Chat', 'Voice', 'Survey', 'Similar'],
      },
      {
        id: 'recommendation',
        type: 'slider',
        label: 'How likely are you to recommend chat/voice to colleagues?',
        min: 1,
        max: 5,
        marks: ['Not likely', 'Slightly', 'Moderately', 'Very', 'Extremely'],
      },
    ],
  },
  final_reflection: {
    title: 'Final Reflection',
    description: 'Overall thoughts on the testing experience',
    questions: [
      {
        id: 'overall_satisfaction',
        type: 'slider',
        label: 'Overall satisfaction with the testing experience?',
        min: 1,
        max: 5,
        marks: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied'],
      },
      {
        id: 'future_method',
        type: 'radio',
        label: 'Which method would you prefer for future feedback?',
        options: ['Traditional Survey', 'Chat Interface', 'Voice Interface', 'Depends on situation'],
      },
      {
        id: 'improvement_suggestions',
        type: 'textarea',
        label: 'Any suggestions for improvement?',
        placeholder: 'Share your ideas...',
      },
      {
        id: 'additional_comments',
        type: 'textarea',
        label: 'Any additional comments?',
        placeholder: 'Share anything else...',
      },
    ],
  },
};

export const TestingQuestionnaire = ({
  sessionId,
  interactionId,
  questionnaireType,
  methodTested,
  onComplete,
  onBack,
}: QuestionnaireProps) => {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const config = QUESTIONNAIRES[questionnaireType];
  const questions = config.questions.filter((q) => {
    if (q.conditional && !responses[q.conditional]) return false;
    return true;
  });

  const handleResponse = (questionId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Calculate summary scores
      const easeOfUseScore = responses.ease_of_use?.[0] || null;
      const comfortScore = responses.comfort?.[0] || null;
      const trustScore = responses.trust?.[0] || null;
      const privacyConfidence = responses.privacy_confidence?.[0] || null;
      const engagementScore = responses.recommendation?.[0] || null;
      const overallSatisfaction = responses.overall_satisfaction?.[0] || null;

      const { error } = await supabase
        .from('testing_questionnaires')
        .insert({
          testing_session_id: sessionId,
          testing_interaction_id: interactionId || null,
          questionnaire_type: questionnaireType,
          method_tested: methodTested || null,
          responses,
          ease_of_use_score: easeOfUseScore,
          comfort_score: comfortScore,
          trust_score: trustScore,
          privacy_confidence: privacyConfidence,
          engagement_score: engagementScore,
          overall_satisfaction: overallSatisfaction,
        });

      if (error) throw error;

      toast({
        title: 'Thank you!',
        description: 'Your responses have been saved.',
      });

      onComplete();
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      toast({
        title: 'Error',
        description: 'Failed to save responses. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{config.title}</h2>
          <p className="text-muted-foreground">{config.description}</p>
          <div className="pt-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="space-y-4">
          <Label className="text-base font-medium">{question.label}</Label>

          {question.type === 'slider' && (
            <div className="space-y-4 py-4">
              <Slider
                value={responses[question.id] || [3]}
                onValueChange={(value) => handleResponse(question.id, value)}
                min={question.min || 1}
                max={question.max || 5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-2">
                {question.marks?.map((mark, idx) => (
                  <span key={idx} className="text-center" style={{ width: `${100 / (question.marks?.length || 5)}%` }}>
                    {mark}
                  </span>
                ))}
              </div>
              <div className="text-center">
                <span className="text-lg font-semibold">{responses[question.id]?.[0] || 3}</span>
                <span className="text-sm text-muted-foreground ml-2">/ {question.max}</span>
              </div>
            </div>
          )}

          {question.type === 'radio' && (
            <RadioGroup
              value={responses[question.id]}
              onValueChange={(value) => handleResponse(question.id, value)}
            >
              {question.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                  <Label htmlFor={`${question.id}-${option}`} className="font-normal cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type === 'textarea' && (
            <Textarea
              value={responses[question.id] || ''}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              placeholder={question.placeholder}
              rows={5}
              className="resize-none"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0 && !onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={loading}
            className="gap-2"
          >
            {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
            {currentQuestion < questions.length - 1 && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
};

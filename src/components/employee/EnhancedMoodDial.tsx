import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Smile, 
  Frown, 
  Meh,
  Lightbulb,
  Target
} from "lucide-react";

interface EnhancedMoodDialProps {
  initialMood?: number;
  onMoodChange: (mood: number, emotionalContext: EmotionalContext) => void;
  isInitial?: boolean;
  previousMood?: number;
}

interface EmotionalContext {
  primary: string;
  secondary: string;
  intensity: 'low' | 'medium' | 'high';
  trend: 'improving' | 'stable' | 'declining';
  insights: string[];
}

const MOOD_EMOTIONS = [
  { range: [0, 20], emotion: "Very Negative", icon: Frown, color: "text-red-600", bgColor: "bg-red-50" },
  { range: [21, 40], emotion: "Negative", icon: Frown, color: "text-red-500", bgColor: "bg-red-50" },
  { range: [41, 60], emotion: "Neutral", icon: Meh, color: "text-yellow-600", bgColor: "bg-yellow-50" },
  { range: [61, 80], emotion: "Positive", icon: Smile, color: "text-green-500", bgColor: "bg-green-50" },
  { range: [81, 100], emotion: "Very Positive", icon: Smile, color: "text-green-600", bgColor: "bg-green-50" }
];

const EMOTIONAL_INSIGHTS = {
  "Very Negative": [
    "It sounds like you're going through a really tough time",
    "Your feelings are completely valid and important",
    "This is exactly the kind of feedback that helps organizations improve"
  ],
  "Negative": [
    "I can hear that things aren't quite where you'd like them to be",
    "Your perspective is valuable for making positive changes",
    "Let's explore what's contributing to how you're feeling"
  ],
  "Neutral": [
    "It sounds like you're in a balanced place right now",
    "Sometimes neutral feelings can indicate areas for growth",
    "I'd love to understand what's working and what could be better"
  ],
  "Positive": [
    "That's wonderful to hear!",
    "It's great that you're feeling positive about work",
    "Let's explore what's contributing to your positive experience"
  ],
  "Very Positive": [
    "That's fantastic! I'm so glad you're feeling great",
    "Your positive energy is wonderful to hear about",
    "Let's celebrate what's working really well for you"
  ]
};

export const EnhancedMoodDial = ({ 
  initialMood = 50, 
  onMoodChange, 
  isInitial = false,
  previousMood 
}: EnhancedMoodDialProps) => {
  const [mood, setMood] = useState(initialMood);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate emotional context based on mood
  const getEmotionalContext = (moodValue: number): EmotionalContext => {
    const currentEmotion = MOOD_EMOTIONS.find(e => 
      moodValue >= e.range[0] && moodValue <= e.range[1]
    ) || MOOD_EMOTIONS[2]; // Default to neutral

    const intensity = moodValue <= 20 || moodValue >= 80 ? 'high' :
                     moodValue <= 40 || moodValue >= 60 ? 'medium' : 'low';

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (previousMood !== undefined) {
      if (moodValue > previousMood + 10) trend = 'improving';
      else if (moodValue < previousMood - 10) trend = 'declining';
    }

    const insights = EMOTIONAL_INSIGHTS[currentEmotion.emotion] || [];

    return {
      primary: currentEmotion.emotion,
      secondary: intensity === 'high' ? 'Strong feelings' : 
                intensity === 'medium' ? 'Moderate feelings' : 'Gentle feelings',
      intensity,
      trend,
      insights
    };
  };

  const currentEmotion = MOOD_EMOTIONS.find(e => 
    mood >= e.range[0] && mood >= e.range[1]
  ) || MOOD_EMOTIONS[2];

  const emotionalContext = getEmotionalContext(mood);

  const handleMoodChange = (value: number[]) => {
    setMood(value[0]);
  };

  const handleContinue = () => {
    onMoodChange(mood, emotionalContext);
  };

  // Auto-save mood changes
  useEffect(() => {
    if (!isDragging) {
      const timer = setTimeout(() => {
        onMoodChange(mood, emotionalContext);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mood, isDragging, emotionalContext, onMoodChange]);

  const getTrendIcon = () => {
    switch (emotionalContext.trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Brain className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTrendText = () => {
    switch (emotionalContext.trend) {
      case 'improving':
        return 'Improving';
      case 'declining':
        return 'Declining';
      default:
        return 'Stable';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Heart className="h-6 w-6 text-pink-600" />
          <span>
            {isInitial ? "How are you feeling about work right now?" : "How do you feel after our conversation?"}
          </span>
        </CardTitle>
        {!isInitial && previousMood !== undefined && (
          <p className="text-sm text-muted-foreground">
            Previous mood: {previousMood}/100
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Mood Slider with Enhanced Visual Design */}
        <div className="space-y-4">
          <div className="relative">
            <Slider
              value={[mood]}
              onValueChange={handleMoodChange}
              onValueCommit={() => setIsDragging(false)}
              onPointerDown={() => setIsDragging(true)}
              max={100}
              step={1}
              className="w-full"
            />
            
            {/* Visual mood indicators */}
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Very Negative</span>
              <span>Neutral</span>
              <span>Very Positive</span>
            </div>
          </div>

          {/* Current Mood Display */}
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-gray-900">{mood}</div>
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${currentEmotion.bgColor}`}>
              <currentEmotion.icon className={`h-4 w-4 ${currentEmotion.color}`} />
              <span className={`text-sm font-medium ${currentEmotion.color}`}>
                {currentEmotion.emotion}
              </span>
            </div>
          </div>
        </div>

        {/* Emotional Context Analysis */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Intensity</div>
              <div className="font-medium capitalize">{emotionalContext.intensity}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Trend</div>
              <div className="flex items-center justify-center space-x-1">
                {getTrendIcon()}
                <span className="font-medium">{getTrendText()}</span>
              </div>
            </div>
          </div>

          {/* Emotional Insights */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">What this tells us:</span>
            </div>
            <div className="space-y-1">
              {emotionalContext.insights.map((insight, index) => (
                <div key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                  <Target className="h-3 w-3 mt-1 text-blue-500" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mood Change Indicator */}
          {!isInitial && previousMood !== undefined && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                {mood > previousMood ? (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Your mood has improved by {mood - previousMood} points!</span>
                  </div>
                ) : mood < previousMood ? (
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4" />
                    <span>Your mood has changed by {mood - previousMood} points</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4" />
                    <span>Your mood has remained stable</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button 
            onClick={handleContinue}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isInitial ? "Start Conversation" : "Complete Feedback"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
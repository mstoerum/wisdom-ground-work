import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

interface MoodDialProps {
  onMoodSelect: (mood: number) => void;
}

const moodLabels = [
  { value: 0, label: "Struggling", emoji: "😔" },
  { value: 25, label: "Concerned", emoji: "😟" },
  { value: 50, label: "Neutral", emoji: "😐" },
  { value: 75, label: "Good", emoji: "🙂" },
  { value: 100, label: "Thriving", emoji: "😊" }
];

export const MoodDial = ({ onMoodSelect }: MoodDialProps) => {
  const [mood, setMood] = useState([50]);

  const currentMood = moodLabels.reduce((prev, curr) => 
    Math.abs(curr.value - mood[0]) < Math.abs(prev.value - mood[0]) ? curr : prev
  );

  const handleChange = (value: number[]) => {
    setMood(value);
    onMoodSelect(value[0]);
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-card to-card/50 border-border/50">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">How are you feeling today?</h2>
        <p className="text-muted-foreground">Share your current state with us</p>
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="text-6xl animate-scale-in">{currentMood.emoji}</div>
        <div className="text-xl font-medium text-foreground">{currentMood.label}</div>
        
        <div className="w-full max-w-md px-4">
          <Slider
            value={mood}
            onValueChange={handleChange}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>
        
        <div className="flex justify-between w-full max-w-md px-4 text-xs text-muted-foreground">
          <span>Struggling</span>
          <span>Thriving</span>
        </div>
      </div>
    </Card>
  );
};

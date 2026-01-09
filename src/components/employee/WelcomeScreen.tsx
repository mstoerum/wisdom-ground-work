import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ChevronDown, ChevronUp, MessageSquare, Lock, BarChart3, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { BackgroundAnonymization } from "./BackgroundAnonymization";

interface MoodOption {
  value: number;
  label: string;
  emoji: string;
}

const moods: MoodOption[] = [
  { value: 1, label: "Tough", emoji: "😔" },
  { value: 2, label: "Not great", emoji: "😟" },
  { value: 3, label: "Okay", emoji: "😐" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 5, label: "Great!", emoji: "😊" },
];

interface FAQItem {
  icon: React.ReactNode;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    icon: <MessageSquare className="h-4 w-4" />,
    question: "What happens to my answers?",
    answer: "Your responses are analyzed by AI to identify themes and patterns. These are combined with feedback from others to create anonymized insights — your individual answers are never shared directly.",
  },
  {
    icon: <Lock className="h-4 w-4" />,
    question: "Is it truly anonymous?",
    answer: "Yes. Your identity is never connected to your responses. HR and leadership only see collective themes and patterns, not who said what.",
  },
  {
    icon: <BarChart3 className="h-4 w-4" />,
    question: "Does my feedback matter?",
    answer: "Absolutely. Your voice adds to the bigger picture. When patterns emerge, leadership gains the insight needed to understand and prioritize what matters most. The more informed the company is, the better equipped they are to take meaningful action.",
  },
  {
    icon: <SkipForward className="h-4 w-4" />,
    question: "Can I skip questions?",
    answer: "You're in control. Share as much or as little as you're comfortable with. You can also finish the conversation early if needed.",
  },
];

interface WelcomeScreenProps {
  surveyId: string;
  surveyDetails: any;
  onComplete: (mood: number) => void;
  onDecline: () => void;
  anonymizationLevel?: string;
}

export const WelcomeScreen = ({
  surveyId,
  surveyDetails,
  onComplete,
  onDecline,
  anonymizationLevel = "anonymous",
}: WelcomeScreenProps) => {
  const [consentChecked, setConsentChecked] = useState(false);
  const [faqExpanded, setFaqExpanded] = useState(false);
  const [hoveredMood, setHoveredMood] = useState<number | null>(null);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [anonymizationComplete, setAnonymizationComplete] = useState(false);

  // Check if first-time user
  const isFirstTime = !localStorage.getItem("spradley-visited");

  // Auto-expand FAQ for first-time users (collapsed by default but visible)
  useEffect(() => {
    if (isFirstTime) {
      // Keep collapsed but visible
    }
  }, [isFirstTime]);

  const handleMoodSelect = (mood: number) => {
    if (!consentChecked) return;
    
    setSelectedMood(mood);
    // Store mood for the transition screen
    localStorage.setItem('spradley_initial_mood', mood.toString());
    // Slightly longer delay for smoother handoff
    setTimeout(() => {
      onComplete(mood);
    }, 400);
  };

  const isReturningUser = localStorage.getItem("spradley-visited") === "true";

  return (
    <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-6">
      {/* Background Anonymization Indicator */}
      <BackgroundAnonymization 
        duration={1500} 
        onComplete={() => setAnonymizationComplete(true)} 
      />

      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
          {isReturningUser ? "Welcome back!" : "This is different."}
        </h1>
        
        {!isReturningUser && (
          <motion.p
            className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            Hi, I'm Spradley — your AI feedback companion. We'll have a quick conversation, not fill out forms. Everything stays anonymous.
          </motion.p>
        )}
        
        {isReturningUser && (
          <motion.p
            className="text-lg text-muted-foreground max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            Ready for another conversation?
          </motion.p>
        )}
      </motion.div>

      {/* Trust Badge */}
      <motion.div
        className="flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-card border border-border"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Shield className="h-4 w-4 text-[hsl(var(--lime-green))]" />
        <span className="text-sm font-medium text-muted-foreground">Anonymous</span>
      </motion.div>

      {/* Divider */}
      <motion.div
        className="w-full max-w-md h-px bg-border mb-8"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      />

      {/* Mood Question */}
      <motion.h2
        className="text-xl md:text-2xl font-medium text-foreground text-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        How's work been this week?
      </motion.h2>

      {/* Mood Buttons */}
      <motion.div
        className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        {moods.map((mood, index) => (
          <motion.button
            key={mood.value}
            onClick={() => handleMoodSelect(mood.value)}
            onMouseEnter={() => setHoveredMood(mood.value)}
            onMouseLeave={() => setHoveredMood(null)}
            disabled={!consentChecked || selectedMood !== null}
            className={cn(
              "flex flex-col items-center justify-center p-4 md:p-5 rounded-2xl",
              "border-2 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "min-w-[80px] md:min-w-[100px]",
              !consentChecked && "opacity-50 cursor-not-allowed bg-muted",
              consentChecked && selectedMood === mood.value && "border-primary bg-primary/10 scale-105",
              consentChecked && selectedMood !== mood.value && hoveredMood === mood.value && "border-primary/50 bg-muted/50",
              consentChecked && selectedMood !== mood.value && hoveredMood !== mood.value && "bg-card border-border hover:border-primary/30"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: selectedMood === mood.value ? 1.05 : 1
            }}
            transition={{ 
              delay: 0.35 + index * 0.06,
              scale: { duration: 0.2 }
            }}
            whileHover={{ scale: consentChecked && !selectedMood ? 1.05 : 1 }}
            whileTap={{ scale: consentChecked ? 0.95 : 1 }}
            aria-label={`Select mood: ${mood.label}`}
          >
            <span 
              className={cn(
                "text-4xl md:text-5xl mb-2 transition-transform duration-200",
                consentChecked && (hoveredMood === mood.value || selectedMood === mood.value) && "scale-110"
              )}
              role="img" 
              aria-hidden="true"
            >
              {mood.emoji}
            </span>
            <span 
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                selectedMood === mood.value ? "text-primary" : "text-muted-foreground"
              )}
            >
              {mood.label}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Divider */}
      <motion.div
        className="w-full max-w-md h-px bg-border mb-6"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      />

      {/* Consent Checkbox */}
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.2 }}
      >
        <Checkbox
          id="consent"
          checked={consentChecked}
          onCheckedChange={(checked) => setConsentChecked(checked === true)}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <label
          htmlFor="consent"
          className="text-sm text-muted-foreground cursor-pointer select-none"
        >
          I understand my feedback is anonymous
        </label>
      </motion.div>

      {/* New to Spradley? Expandable */}
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.2 }}
      >
        <button
          onClick={() => setFaqExpanded(!faqExpanded)}
          className="flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {faqExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span>New to Spradley?</span>
        </button>

        <AnimatePresence>
          {faqExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 pb-2 space-y-4">
                {faqItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground mb-1">
                        {item.question}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Not now link */}
      <motion.button
        onClick={onDecline}
        className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.2 }}
      >
        Not now
      </motion.button>
    </div>
  );
};

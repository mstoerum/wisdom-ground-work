import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ChevronDown, ChevronUp, MessageSquare, Lock, BarChart3, SkipForward } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { BackgroundAnonymization } from "./BackgroundAnonymization";

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
  onComplete: () => void;
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
  const [anonymizationComplete, setAnonymizationComplete] = useState(false);

  const isReturningUser = localStorage.getItem("spradley-visited") === "true";

  const handleContinue = () => {
    if (!consentChecked) return;
    onComplete();
  };

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

      {/* Consent Checkbox */}
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.2 }}
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

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.2 }}
      >
        <Button
          onClick={handleContinue}
          disabled={!consentChecked}
          size="lg"
          className="px-8"
        >
          Continue
        </Button>
      </motion.div>

      {/* New to Spradley? Expandable */}
      <motion.div
        className="w-full max-w-md mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.2 }}
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
        transition={{ delay: 0.5, duration: 0.2 }}
      >
        Not now
      </motion.button>
    </div>
  );
};

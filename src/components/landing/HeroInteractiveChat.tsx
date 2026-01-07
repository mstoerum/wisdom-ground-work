import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { BreathingCircle } from './BreathingCircle';

const MAX_EXCHANGES = 2;

const OPENING_MESSAGE = "Hi! I'm Spradley. How's work been going for you lately—anything on your mind?";

export const HeroInteractiveChat: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(OPENING_MESSAGE);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([
    { role: 'assistant', content: OPENING_MESSAGE }
  ]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Update conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];
    setConversationHistory(updatedHistory);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          conversationId: `preview-hero-${Date.now()}`,
          testMode: true,
          conversationHistory: updatedHistory
        }
      });

      if (error) throw error;

      const aiResponse = data?.response || "Thank you for sharing that with me. Your perspective is really valuable.";
      
      setConversationHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setCurrentQuestion(aiResponse);
      setExchangeCount(prev => prev + 1);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackResponse = "Thank you for sharing. I appreciate your openness—it helps me understand your experience better.";
      setConversationHistory(prev => [...prev, { role: 'assistant', content: fallbackResponse }]);
      setCurrentQuestion(fallbackResponse);
      setExchangeCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showCTA = exchangeCount >= MAX_EXCHANGES;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl overflow-hidden">
        {/* Main content area */}
        <div className="p-8 md:p-10 flex flex-col items-center text-center space-y-6">
          {/* Breathing Circle */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <BreathingCircle isLoading={isLoading} size="md" />
          </motion.div>

          {/* Question Display */}
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-1 py-4">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <p className="text-xl md:text-2xl font-medium leading-relaxed text-foreground">
                {currentQuestion}
              </p>
            )}
          </motion.div>

          {/* Input Area or CTA */}
          {!showCTA ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="w-full space-y-4"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Share what's on your mind..."
                className="min-h-[100px] text-base rounded-xl resize-none border-border/50 focus:border-primary/50 bg-background/50"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="rounded-full px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isLoading ? (
                  'Thinking...'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Link to="/demo/employee">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg"
                >
                  Continue Full Experience
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Privacy Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border/30">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              100% Anonymous
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              End-to-end Encrypted
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

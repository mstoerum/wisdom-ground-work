import { useState, useEffect, useRef } from "react";

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  startDelay?: number;
  enabled?: boolean;
  onComplete?: () => void;
}

interface UseTypewriterReturn {
  displayText: string;
  isTyping: boolean;
  isComplete: boolean;
}

/**
 * Hook that reveals text character by character (typewriter effect).
 * Reduces perceived wait time by letting users start reading immediately.
 */
export const useTypewriter = ({
  text,
  speed = 30,
  startDelay = 0,
  enabled = true,
  onComplete,
}: UseTypewriterOptions): UseTypewriterReturn => {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref up to date
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Cleanup previous animation
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Reset state
    setDisplayText("");
    setIsComplete(false);
    indexRef.current = 0;

    // Skip if no text or not enabled
    if (!text || !enabled) {
      setIsTyping(false);
      if (!text) setIsComplete(true);
      return;
    }

    setIsTyping(true);

    // Start typing after delay
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        indexRef.current += 1;
        const currentIndex = indexRef.current;

        if (currentIndex >= text.length) {
          setDisplayText(text);
          setIsTyping(false);
          setIsComplete(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          onCompleteRef.current?.();
        } else {
          setDisplayText(text.slice(0, currentIndex));
        }
      }, speed);
    }, startDelay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed, startDelay, enabled]);

  return { displayText, isTyping, isComplete };
};

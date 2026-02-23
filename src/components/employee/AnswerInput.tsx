import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HoverButton } from "@/components/ui/hover-button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Mic, MicOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { soundEffects } from "@/utils/soundEffects";
import { useToast } from "@/hooks/use-toast";

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onTranscribe?: (audioBlob: Blob) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const AnswerInput = ({
  value,
  onChange,
  onSubmit,
  onTranscribe,
  isLoading = false,
  placeholder = "Share your thoughts...",
  disabled = false,
}: AnswerInputProps) => {
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Focus textarea on mount
  useEffect(() => {
    if (!isLoading && !disabled) {
      textareaRef.current?.focus();
    }
  }, [isLoading, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (onTranscribe) {
          onTranscribe(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      soundEffects.playRecordStart();
    } catch (error) {
      soundEffects.playError();
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      soundEffects.playRecordStop();
    }
  };

  const canSubmit = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading || disabled}
          className="min-h-[120px] text-lg p-4 resize-none bg-background border-border/50 rounded-xl focus:ring-2 focus:ring-[hsl(var(--terracotta-primary))]/20 focus:border-[hsl(var(--terracotta-primary))]"
          aria-label="Your response"
        />
        
        {/* Voice input button */}
        {onTranscribe && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading || disabled}
            className={`absolute bottom-3 right-3 h-8 w-8 rounded-full transition-colors ${
              isRecording 
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <div className="flex justify-center">
        <HoverButton
          onClick={onSubmit}
          disabled={!canSubmit}
          className="px-8 py-6 text-lg font-medium bg-[hsl(var(--terracotta-primary))] hover:bg-[hsl(var(--terracotta-primary))]/90 text-primary-foreground rounded-full transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 inline-flex items-center justify-center"
          style={{ "--circle-start": "hsl(var(--terracotta-primary))", "--circle-end": "hsl(var(--coral-accent))" } as React.CSSProperties}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </HoverButton>
      </div>
    </motion.div>
  );
};

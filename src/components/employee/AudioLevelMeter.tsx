import { useEffect, useRef, useState } from 'react';
import { Mic, AlertTriangle } from 'lucide-react';

interface AudioLevelMeterProps {
  audioLevel: number;
  isActive: boolean;
}

/**
 * Enhanced audio level visualization meter
 * Shows real-time microphone input level with status indicators
 * Now always visible when active to confirm microphone is working
 */
export const AudioLevelMeter = ({ audioLevel, isActive }: AudioLevelMeterProps) => {
  const meterRef = useRef<HTMLDivElement>(null);
  const [lowAudioWarning, setLowAudioWarning] = useState(false);
  const lowAudioTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!meterRef.current || !isActive) return;

    const level = Math.min(audioLevel / 100, 1);
    const bars = meterRef.current.children;
    
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i] as HTMLElement;
      const threshold = (i + 1) / bars.length;
      if (level >= threshold) {
        bar.style.opacity = '1';
        bar.style.transform = 'scaleY(1)';
      } else {
        bar.style.opacity = '0.3';
        bar.style.transform = 'scaleY(0.5)';
      }
    }

    // Track low audio levels
    if (audioLevel < 5) {
      if (!lowAudioTimerRef.current) {
        lowAudioTimerRef.current = setTimeout(() => {
          setLowAudioWarning(true);
        }, 3000);
      }
    } else {
      if (lowAudioTimerRef.current) {
        clearTimeout(lowAudioTimerRef.current);
        lowAudioTimerRef.current = null;
      }
      setLowAudioWarning(false);
    }
  }, [audioLevel, isActive]);

  useEffect(() => {
    return () => {
      if (lowAudioTimerRef.current) {
        clearTimeout(lowAudioTimerRef.current);
      }
    };
  }, []);

  if (!isActive) return null;

  // Get color based on audio level
  const getBarColor = (index: number) => {
    const barThreshold = (index + 1) / 15;
    if (barThreshold < 0.6) return 'bg-[hsl(var(--lime-green))]';
    if (barThreshold < 0.85) return 'bg-[hsl(var(--butter-yellow))]';
    return 'bg-[hsl(var(--terracotta-red))]';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        {audioLevel > 10 ? (
          <div className="flex items-center gap-1 text-xs text-[hsl(var(--lime-green))]">
            <Mic className="h-3 w-3" />
            <span>Microphone active</span>
          </div>
        ) : lowAudioWarning ? (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertTriangle className="h-3 w-3" />
            <span>No audio detected</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mic className="h-3 w-3" />
            <span>Listening...</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center gap-1 h-10" ref={meterRef} role="meter" aria-label="Audio level meter">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-100 ${getBarColor(i)}`}
            style={{
              height: `${(i + 1) * 6}%`,
              opacity: 0.3,
              transform: 'scaleY(0.5)',
              willChange: 'transform',
            }}
          />
        ))}
      </div>
    </div>
  );
};

import { useEffect, useRef } from 'react';

interface AudioLevelMeterProps {
  audioLevel: number;
  isActive: boolean;
}

/**
 * Audio level visualization meter
 * Shows real-time microphone input level
 */
export const AudioLevelMeter = ({ audioLevel, isActive }: AudioLevelMeterProps) => {
  const meterRef = useRef<HTMLDivElement>(null);

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
  }, [audioLevel, isActive]);

  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center gap-1 h-8" ref={meterRef}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="w-1 bg-lime-green rounded-full transition-all duration-100"
          style={{
            height: `${(i + 1) * 8}%`,
            opacity: 0.3,
            transform: 'scaleY(0.5)',
          }}
        />
      ))}
    </div>
  );
};

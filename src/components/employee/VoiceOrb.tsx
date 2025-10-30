import { useEffect, useRef } from 'react';
import { VoiceState } from '@/hooks/useVoiceChat';

interface VoiceOrbProps {
  state: VoiceState;
  audioLevel?: number;
}

/**
 * Animated voice orb component inspired by "Her" movie
 * Visualizes voice state and audio levels with smooth animations
 */
export const VoiceOrb = ({ state, audioLevel = 0 }: VoiceOrbProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 80;

    const animate = () => {
      timeRef.current += 0.02;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate dynamic radius based on state and audio level
      let radiusMultiplier = 1;
      let numberOfWaves = 3;
      let waveSpeed = 1;
      let waveAmplitude = 10;

      switch (state) {
        case 'idle':
          radiusMultiplier = 1;
          waveAmplitude = 5;
          numberOfWaves = 2;
          break;
        case 'connecting':
          radiusMultiplier = 1 + Math.sin(timeRef.current * 2) * 0.1;
          waveAmplitude = 8;
          numberOfWaves = 2;
          break;
        case 'listening':
          radiusMultiplier = 1 + (audioLevel / 100) * 0.3;
          waveAmplitude = 15 + (audioLevel / 100) * 20;
          numberOfWaves = 4;
          waveSpeed = 1.5;
          break;
        case 'speaking':
          radiusMultiplier = 1 + Math.sin(timeRef.current * 3) * 0.15;
          waveAmplitude = 20;
          numberOfWaves = 5;
          waveSpeed = 2;
          break;
        case 'processing':
          radiusMultiplier = 1 + Math.sin(timeRef.current * 4) * 0.08;
          waveAmplitude = 12;
          numberOfWaves = 3;
          waveSpeed = 2;
          break;
        case 'error':
          radiusMultiplier = 1;
          waveAmplitude = 5;
          numberOfWaves = 1;
          break;
      }

      // Draw multiple wave layers
      for (let layer = 0; layer < numberOfWaves; layer++) {
        ctx.beginPath();
        
        const layerOffset = layer * 0.5;
        const points = 100;
        
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          
          // Create organic wave pattern
          const wave1 = Math.sin(angle * 3 + timeRef.current * waveSpeed + layerOffset) * waveAmplitude;
          const wave2 = Math.sin(angle * 5 - timeRef.current * waveSpeed * 0.7 + layerOffset) * (waveAmplitude * 0.5);
          const wave3 = Math.sin(angle * 7 + timeRef.current * waveSpeed * 0.5 + layerOffset) * (waveAmplitude * 0.3);
          
          const radius = (baseRadius + wave1 + wave2 + wave3) * radiusMultiplier;
          
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        
        // Gradient fill based on state
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * radiusMultiplier);
        
        switch (state) {
          case 'idle':
            gradient.addColorStop(0, `rgba(245, 158, 11, ${0.3 - layer * 0.08})`); // Butter yellow
            gradient.addColorStop(1, `rgba(245, 158, 11, ${0.1 - layer * 0.03})`);
            break;
          case 'connecting':
            gradient.addColorStop(0, `rgba(251, 146, 60, ${0.4 - layer * 0.1})`); // Coral
            gradient.addColorStop(1, `rgba(251, 146, 60, ${0.1 - layer * 0.03})`);
            break;
          case 'listening':
            gradient.addColorStop(0, `rgba(132, 204, 22, ${0.5 - layer * 0.1})`); // Lime green
            gradient.addColorStop(1, `rgba(132, 204, 22, ${0.15 - layer * 0.04})`);
            break;
          case 'speaking':
            gradient.addColorStop(0, `rgba(217, 119, 6, ${0.6 - layer * 0.12})`); // Terracotta
            gradient.addColorStop(1, `rgba(217, 119, 6, ${0.2 - layer * 0.05})`);
            break;
          case 'processing':
            gradient.addColorStop(0, `rgba(251, 146, 60, ${0.4 - layer * 0.1})`); // Coral
            gradient.addColorStop(1, `rgba(245, 158, 11, ${0.1 - layer * 0.03})`);
            break;
          case 'error':
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)'); // Red
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
            break;
        }
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Subtle stroke
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 - layer * 0.05})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state, audioLevel]);

  return (
    <div className="flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="max-w-full h-auto"
      />
    </div>
  );
};

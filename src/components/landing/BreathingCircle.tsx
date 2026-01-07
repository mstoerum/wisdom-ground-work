import React from 'react';

interface BreathingCircleProps {
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({ 
  isLoading = false,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28'
  };

  const duration = isLoading ? '1.5s' : '4s';

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      {/* Outer ring */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-coral/20"
        style={{
          animation: `breathe ${duration} ease-in-out infinite`,
          animationDelay: '0.2s'
        }}
      />
      
      {/* Middle ring */}
      <div 
        className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/30 to-coral/30"
        style={{
          animation: `breathe ${duration} ease-in-out infinite`,
          animationDelay: '0.1s'
        }}
      />
      
      {/* Inner core */}
      <div 
        className="absolute inset-4 rounded-full bg-gradient-to-br from-primary to-coral shadow-lg"
        style={{
          animation: `breathe ${duration} ease-in-out infinite`,
          boxShadow: '0 0 20px hsl(var(--primary) / 0.4)'
        }}
      />

      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          animation: `glow ${duration} ease-in-out infinite`,
          boxShadow: '0 0 30px hsl(var(--primary) / 0.3)'
        }}
      />

      <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }
        
        @keyframes glow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

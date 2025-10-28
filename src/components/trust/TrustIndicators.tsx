import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Lock, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TrustIndicatorsProps {
  sessionId: string;
  participantCount?: number;
  className?: string;
}

export const TrustIndicators: React.FC<TrustIndicatorsProps> = ({ 
  sessionId, 
  participantCount = 127,
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-between p-4 bg-blue-50 border-b border-blue-200 ${className}`}>
      <div className="flex items-center space-x-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="flex items-center space-x-2 cursor-help">
                <Lock className="w-3 h-3" />
                <span>Anonymous Session {sessionId}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>HR sees session {sessionId}, not your name</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="text-sm text-muted-foreground flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{participantCount} employees participated anonymously this week</span>
        </div>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-xs text-muted-foreground cursor-help flex items-center space-x-1">
              <Info className="w-3 h-3" />
              <span>Privacy Protected</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>• Your identity is completely hidden</p>
              <p>• HR only sees anonymous feedback</p>
              <p>• Data is encrypted and secure</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
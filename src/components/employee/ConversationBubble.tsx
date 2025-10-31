import { format } from "date-fns";

interface ConversationBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

export const ConversationBubble = ({ message, isUser, timestamp }: ConversationBubbleProps) => {
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      {!isUser && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta-primary))] via-[hsl(var(--coral-pink))] to-[hsl(var(--butter-yellow))] flex-shrink-0 shadow-sm" />
      )}
      
      <div
        className={`max-w-lg px-4 py-3 transition-all duration-200 ${
          isUser
            ? "bg-[hsl(var(--coral-pink))] text-[hsl(var(--coral-accent))] rounded-3xl rounded-tr-lg"
            : "bg-muted text-foreground rounded-3xl rounded-tl-lg"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        <span className="text-xs opacity-60 mt-2 block">
          {format(timestamp, "HH:mm")}
        </span>
      </div>

      {isUser && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--butter-yellow))] to-[hsl(var(--coral-pink))] flex-shrink-0 shadow-sm" />
      )}
    </div>
  );
};

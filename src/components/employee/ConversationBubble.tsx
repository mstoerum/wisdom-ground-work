import { format } from "date-fns";

interface ConversationBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

export const ConversationBubble = ({ message, isUser, timestamp }: ConversationBubbleProps) => {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message}</p>
        <span className="text-xs opacity-70 mt-2 block">
          {format(timestamp, "HH:mm")}
        </span>
      </div>
    </div>
  );
};

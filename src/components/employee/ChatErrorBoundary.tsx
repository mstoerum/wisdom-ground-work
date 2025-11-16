import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
  conversationId: string;
  onExit: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Chat error caught:", error);
    
    // Skip database logging in preview mode (conversationId starts with "preview-")
    const isPreviewMode = this.props.conversationId?.startsWith('preview-');
    
    if (!isPreviewMode) {
      // Log to escalation_log for HR visibility (only in non-preview mode)
      supabase.from('escalation_log').insert({
        escalation_type: 'technical_error',
        response_id: null,
        resolution_notes: `Chat interface error: ${error.message}`,
      }).then(({ error: logError }) => {
        if (logError) console.error("Failed to log error:", logError);
      }).catch((err) => {
        // Silently fail if logging fails (e.g., no auth)
        console.error("Error logging to escalation_log:", err);
      });
    } else {
      console.log("Preview mode: skipping error logging to database");
    }
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isPreviewMode = this.props.conversationId?.startsWith('preview-');
      
      return (
        <div className="flex items-center justify-center h-[600px] p-6">
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>
                {isPreviewMode 
                  ? "An error occurred in preview mode. Please try again or check that all survey fields are properly filled."
                  : "Don't worry, your progress is saved and you can resume anytime."}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={this.handleTryAgain}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.props.onExit}
                  variant="secondary"
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isPreviewMode ? "Close Preview" : "Exit & Resume Later"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
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
    
    // Log to escalation_log for HR visibility
    supabase.from('escalation_log').insert({
      escalation_type: 'technical_error',
      response_id: null,
      resolution_notes: `Chat interface error: ${error.message}`,
    }).then(({ error: logError }) => {
      if (logError) console.error("Failed to log error:", logError);
    });
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-[600px] p-6">
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>Don't worry, your progress is saved and you can resume anytime.</p>
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
                  Exit & Resume Later
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
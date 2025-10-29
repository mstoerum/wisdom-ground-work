import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { Alert, AlertDescription } from './alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm">Something went wrong</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We encountered an unexpected error. This has been logged and we'll look into it.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} size="sm" variant="outline">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  size="sm"
                >
                  Refresh Page
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
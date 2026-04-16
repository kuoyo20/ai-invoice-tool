import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8 max-w-md w-full text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">發生了一些問題</h2>
              <p className="text-sm text-muted-foreground mt-1">
                應用程式遇到了無法處理的錯誤，請重試。
              </p>
              {this.state.error && (
                <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted p-2 rounded-lg break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <Button onClick={this.handleReset} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              重新載入
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

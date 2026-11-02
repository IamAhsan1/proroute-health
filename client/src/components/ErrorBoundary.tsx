import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error in boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="font-headline font-bold text-lg text-on-surface">
            {this.props.fallbackTitle || 'Something went wrong in this view'}
          </h2>
          <p className="text-on-surface-variant text-xs mt-1 max-w-md font-mono bg-surface-container-high p-3 rounded-xl border border-surface-container-highest my-3 text-left overflow-x-auto">
            {this.state.error?.message || 'Unexpected application error'}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => (window.location.href = '/')}
              className="gap-2"
            >
              <Home className="w-3.5 h-3.5" />
              Back to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

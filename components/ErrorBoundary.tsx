import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
          <div className="bg-white p-8 rounded-lg shadow-xl border-t-4 border-red-500 max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">System Error</h1>
            <p className="text-gray-500 mb-6 text-sm">
              We encountered an issue loading this section. This might be due to a network interruption or version mismatch.
            </p>
            <div className="space-y-3">
              <Button fullWidth onClick={() => window.location.reload()}>
                Reload Application
              </Button>
              <button 
                onClick={() => {
                  window.localStorage.clear();
                  window.location.href = '/';
                }}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Clear Cache & Restart
              </button>
            </div>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mt-6 p-4 bg-gray-100 rounded text-left overflow-auto max-h-32 text-xs font-mono text-red-600">
                {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
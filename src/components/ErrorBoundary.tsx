import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="error-boundary-fallback" style={{
          padding: '20px',
          margin: '20px',
          backgroundColor: '#ffeeee',
          borderRadius: '5px',
          color: '#cc0000',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
        }}>
          <h2>Something went wrong</h2>
          <p>The application encountered an error and could not continue.</p>
          {this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '16px' }}>
              <summary>Error details</summary>
              <p>{this.state.error.toString()}</p>
            </details>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{
              margin: '16px 0',
              padding: '8px 16px',
              background: '#cc0000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload the page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 
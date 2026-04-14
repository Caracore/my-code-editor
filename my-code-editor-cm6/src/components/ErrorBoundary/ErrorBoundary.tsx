import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🔴 ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: "20px",
          backgroundColor: "#1e1e1e",
          color: "#ff6b6b",
          fontFamily: "monospace",
          height: "100%",
          overflow: "auto",
        }}>
          <h2 style={{ color: "#ff6b6b", marginBottom: "10px" }}>
            ⚠️ Something went wrong
          </h2>
          <details style={{ whiteSpace: "pre-wrap", marginBottom: "20px" }}>
            <summary style={{ cursor: "pointer", color: "#ffa500" }}>
              Error Details
            </summary>
            <pre style={{ 
              backgroundColor: "#2d2d2d", 
              padding: "10px", 
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "200px",
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <details style={{ whiteSpace: "pre-wrap" }}>
            <summary style={{ cursor: "pointer", color: "#ffa500" }}>
              Component Stack
            </summary>
            <pre style={{ 
              backgroundColor: "#2d2d2d", 
              padding: "10px", 
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "300px",
              fontSize: "12px",
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

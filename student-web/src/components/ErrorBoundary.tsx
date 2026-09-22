import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { ServerErrorPage } from "../pages/ServerErrorPage";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time errors so a broken component never leaves a blank page.
 * Network/API errors are handled by the axios interceptor + <ErrorState>; this
 * is the last line of defence for bugs in the UI itself.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled UI error", error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return <ServerErrorPage message={this.state.error.message} />;
    }

    return this.props.children;
  }
}

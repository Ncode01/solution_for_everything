"use client";

import React, { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackLabel?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Something went wrong",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-surface-container-low p-8 text-center">
          <AlertTriangle className="text-error" size={32} />
          <h2 className="text-body-md font-medium text-on-surface">
            {this.props.fallbackLabel ?? "Something went wrong"}
          </h2>
          <p className="text-body-sm max-w-sm text-on-surface-variant">
            {this.state.message}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="text-body-sm rounded-lg border border-white/10 px-4 py-2 text-on-surface hover:bg-white/5"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

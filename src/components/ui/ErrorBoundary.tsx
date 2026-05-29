"use client";

import React, { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { logOnce } from "@/lib/diagnostics";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackLabel?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  resetKey: number;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: "",
    resetKey: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      message: error.message || "Something went wrong",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logOnce(
      `error-boundary-${this.props.fallbackLabel ?? "default"}`,
      `[UI] ErrorBoundary: ${error.message}`,
    );
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState((s) => ({
      hasError: false,
      message: "",
      resetKey: s.resetKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-surface-container-low p-8 text-center">
          <AlertTriangle className="text-[#DD6974]" size={32} aria-hidden />
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

    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

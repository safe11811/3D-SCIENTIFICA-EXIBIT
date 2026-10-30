import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * App-wide crash guard. On exhibition day this runs on hundreds of varied
 * phones — a single unhandled render error must not blank the guide.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Scientifica encountered an error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#f8fafc] p-6">
          <div className="liquid-glass-panel max-w-sm rounded-3xl px-8 py-10 text-center shadow-[0_24px_60px_-12px_rgba(15,23,42,0.18)]">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white">
              S
            </div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              The exhibition guide hit an unexpected error. Reloading usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="liquid-glass-btn mt-6 min-h-[44px] rounded-2xl px-6 text-sm font-bold text-slate-800"
            >
              Reload the guide
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

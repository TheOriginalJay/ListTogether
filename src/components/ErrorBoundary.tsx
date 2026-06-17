import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-lg border border-[#E5E5E0]/60">
          <div className="w-12 h-12 bg-amber-50 text-[#D97706] rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Something went wrong</h1>
          <p className="text-sm text-[#6B6B5F] mb-6">
            Bagged hit an unexpected error. Your data is safe — reloading usually fixes it.
          </p>
          <button onClick={this.handleReload} className="w-full h-11 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#333] transition-all">
            Reload Bagged
          </button>
        </div>
      </div>
    );
  }
}

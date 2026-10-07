import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(err: unknown): State {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : 'Something went wrong.',
    };
  }

  componentDidCatch(err: unknown) {
    console.error(err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-banner" role="alert">
          <span>{this.state.message ?? 'Something went wrong.'}</span>
          <button
            type="button"
            className="btn-secondary"
            style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '11px' }}
            onClick={() => this.setState({ hasError: false, message: null })}
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Component } from "react";
import Icon from "./Icon";

/**
 * Without a boundary, one render-time exception blanks the entire page. This
 * keeps the failure visible and recoverable.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md text-center">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 mb-4">
            <Icon name="alert" size={22} />
          </span>
          <h1 className="text-lg font-semibold text-white">Something broke on this page</h1>
          <p className="text-sm text-ink-400 mt-2">
            The error has been logged to the console. Reloading usually clears it.
          </p>
          <pre className="text-left text-xs font-mono text-ink-500 bg-ink-900 border border-ink-800 rounded-lg p-3 mt-4 overflow-x-auto">
            {error.message}
          </pre>
          <button type="button" className="btn-primary mt-5" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

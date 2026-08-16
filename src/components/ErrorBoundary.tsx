import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean; error?: Error };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(error: Error) {
    return { failed: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-black p-6 text-center text-white">
        <div>
          <p className="font-mono text-pump">HERMES.FUN</p>
          <h1 className="mt-2 text-3xl font-black">Feed interrupted.</h1>
          <button
            className="mt-5 rounded-md bg-pump px-4 py-2 font-black text-black hover:bg-pump/90 transition-all active:scale-95"
            onClick={() => {
              this.setState({ failed: false, error: undefined });
              location.reload();
            }}
          >
            Reload
          </button>
        </div>
      </main>
    );
  }
}

import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { /* Error is intentionally contained at app shell. */ }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="grid min-h-screen place-items-center bg-black p-6 text-center text-white"><div><p className="font-mono text-pump">HERMES.FUN</p><h1 className="mt-2 text-3xl font-black">Feed interrupted.</h1><button className="mt-5 rounded-md bg-pump px-4 py-2 font-black text-black" onClick={() => location.reload()}>Reload</button></div></main>;
  }
}

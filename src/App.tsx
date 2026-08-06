import { Route, Routes } from 'react-router';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';

export default function App() {
  return <ErrorBoundary><Routes><Route path="/" element={<Home />} /><Route path="/profile" element={<Home initialTab="profile" />} /></Routes></ErrorBoundary>;
}

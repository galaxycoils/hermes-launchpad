import React from 'react';
import { Route, Routes } from 'react-router';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
const Account = React.lazy(() => import('./pages/Account'));

export default function App() {
  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Home initialTab="profile" />} />
        <Route path="/account" element={<React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-pump border-t-transparent"></div></div>}><Account /></React.Suspense>} />
      </Routes>
    </ErrorBoundary>
  );
}

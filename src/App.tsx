import { Route, Routes } from 'react-router'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import Trade from './pages/Trade'
import Profile from './pages/Profile'
import Account from './pages/Account'
import React from 'react'

export default function App() {
  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trade" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/account"
          element={
            <React.Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-pulse border-t-transparent" />
                </div>
              }
            >
              <Account />
            </React.Suspense>
          }
        />
      </Routes>
    </ErrorBoundary>
  )
}
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

// === PWA: Service Worker Registration ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('[PWA] Service Worker registered:', reg.scope)
    }).catch(err => {
      console.error('[PWA] Service Worker registration failed:', err)
    })
  })

  // === PWA: Install Prompt Handling ===
  // The beforeinstallprompt/appinstalled listeners are kept to detect
  // installability. deferredInstallPrompt is nulled on appinstalled.
  // (No inline install button on the landing page yet — WU-03 adds one
  // to TopNav that calls window.triggerInstall when available.)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    console.log('[PWA] beforeinstallprompt fired — app is installable')
  })

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed')
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

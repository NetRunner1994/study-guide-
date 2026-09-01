import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { StoreProvider } from './state'
import './styles.css'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      /* Offline support is optional; the app works without it. */
    })
  })
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const isElectron = !!(window as any).api

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

if (isElectron) {
  // Dynamic import: only load the full Electron app when running inside Electron
  import('./App').then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  })
} else {
  // Browser mode: show lightweight landing page (no Electron dependencies)
  import('./WebLanding').then(({ default: WebLanding }) => {
    root.render(
      <React.StrictMode>
        <WebLanding />
      </React.StrictMode>
    )
  })
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nProvider'
import App from './App'
import { UpdateBanner } from './components/UpdateBanner'
import { listenForInstallPrompt } from './lib/installPrompt'
import './index.css'

listenForInstallPrompt()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <UpdateBanner />
        <App />
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
)

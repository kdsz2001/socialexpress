import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { seedDemoClients } from './lib/seedDemoClients'
import { seedDemoProducts } from './lib/seedDemoProducts'
import { bootTheme } from './lib/themeStore'
import './index.css'

bootTheme()
seedDemoClients(1200)
seedDemoProducts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

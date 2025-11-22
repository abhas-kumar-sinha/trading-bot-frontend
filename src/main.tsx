import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "@/contexts/ThemeContext.tsx";
import { AppProvider } from "@/contexts/AppContext.tsx";
import './index.css'
import App from './App.tsx'
import { Toaster } from 'sonner';
import { CurrencyProvider } from './contexts/CurrencyContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <ThemeProvider>
        <CurrencyProvider>
            <App />
            <Toaster />
        </CurrencyProvider>
      </ThemeProvider>
    </AppProvider>
  </StrictMode>,
)

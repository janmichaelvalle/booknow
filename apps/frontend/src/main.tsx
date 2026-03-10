import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import AuthProvider from './context/AuthContext'
import { QueryClientProvider, QueryClient} from '@tanstack/react-query'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"


const queryClient = new QueryClient()


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools/>
    <AuthProvider>
      <App />
    </AuthProvider>
    </QueryClientProvider>
    </BrowserRouter>
    
  </StrictMode>,
)

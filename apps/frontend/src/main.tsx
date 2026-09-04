import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import AuthProvider from './context/AuthContext'
import { QueryClientProvider, QueryClient} from '@tanstack/react-query'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { GeoapifyContext } from "@geoapify/react-geocoder-autocomplete"
import "@geoapify/geocoder-autocomplete/styles/minimal.css"


const queryClient = new QueryClient()

const geoapifyApiKey = import.meta.env.VITE_GEOAPIFY_API_KEY

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools/>
    <AuthProvider>
      <GeoapifyContext apiKey={geoapifyApiKey}>
      <App />
      </GeoapifyContext>
    </AuthProvider>
    </QueryClientProvider>
    </BrowserRouter>
    
  </StrictMode>,
)

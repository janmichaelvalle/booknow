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
import { setOptions } from "@googlemaps/js-api-loader"

const queryClient = new QueryClient()

const geoapifyApiKey = import.meta.env.VITE_GEOAPIFY_API_KEY
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY


if (!googleMapsApiKey) {
  throw new Error("VITE_GOOGLE_MAPS_API_KEY is missing")
}

setOptions({
  key: googleMapsApiKey,
  v: "weekly",
  language: "en",
  region: "PH",
})

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

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
import { resolveAppSurface } from "@/lib/app-host"

const queryClient = new QueryClient()

const geoapifyApiKey = import.meta.env.VITE_GEOAPIFY_API_KEY
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const surface = resolveAppSurface(window.location.hostname, window.location.pathname)


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
    <BrowserRouter basename={surface.basename}>
    <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools/>
    {surface.kind === "admin" ? (
      <AuthProvider>
        <GeoapifyContext apiKey={geoapifyApiKey}>
          <App surface={surface} />
        </GeoapifyContext>
      </AuthProvider>
    ) : (
      <GeoapifyContext apiKey={geoapifyApiKey}>
        <App surface={surface} />
      </GeoapifyContext>
    )}
    </QueryClientProvider>
    </BrowserRouter>
    
  </StrictMode>,
)

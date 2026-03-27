import { createClient } from '@supabase/supabase-js'

if (!process.env.CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN must be defined')
}
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL must be defined')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY must be defined')
}

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
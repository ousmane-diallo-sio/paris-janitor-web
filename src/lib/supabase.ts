import { createClient } from '@supabase/supabase-js'
import { envConfig } from './env-config'

export const supabase = createClient(
  envConfig.supabase.url,
  envConfig.supabase.apiKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

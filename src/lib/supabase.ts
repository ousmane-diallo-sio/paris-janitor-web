import { createClient } from '@supabase/supabase-js'
import { envConfig } from './env-config'
import type { Database } from '@/types/supabase'

export const supabase = createClient<Database>(
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


export const envConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
    apiKey: import.meta.env.VITE_SUPABASE_API_KEY || 'placeholder-api-key'
  },
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
  },
  dev: {
    email: import.meta.env.VITE_DEV_USER_EMAIL || 'dev@parisjanitor.com',
    password: import.meta.env.VITE_DEV_USER_PASSWORD || 'DevPassword123!'
  }
}

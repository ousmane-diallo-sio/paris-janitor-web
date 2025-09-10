
export const envConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
    apiKey: import.meta.env.VITE_SUPABASE_API_KEY || 'placeholder-api-key'
  },
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
  },
  dev: {
    propertyOwner: {
      email: import.meta.env.VITE_DEV_PROPERTY_OWNER_EMAIL || 'owner@parisjanitor.com',
      password: import.meta.env.VITE_DEV_PROPERTY_OWNER_PASSWORD || 'OwnerPass123!',
      fullName: 'Propriétaire Dev',
      phone: '+33123456789',
      role: 'property_owner' as const
    },
    traveler: {
      email: import.meta.env.VITE_DEV_TRAVELER_EMAIL || 'traveler@parisjanitor.com',
      password: import.meta.env.VITE_DEV_TRAVELER_PASSWORD || 'TravelerPass123!',
      fullName: 'Voyageur Dev',
      phone: '+33123456790',
      role: 'traveler' as const
    },
    serviceProvider: {
      email: import.meta.env.VITE_DEV_SERVICE_PROVIDER_EMAIL || 'provider@parisjanitor.com',
      password: import.meta.env.VITE_DEV_SERVICE_PROVIDER_PASSWORD || 'ProviderPass123!',
      fullName: 'Prestataire Dev',
      phone: '+33123456791',
      role: 'service_provider' as const
    }
  }
}

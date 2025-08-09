import { supabase } from './supabase'
import type { 
  Profile, 
  Property, 
  Booking, 
  Service, 
  ServiceRequest,
  TablesInsert,
  TablesUpdate 
} from '@/types/database'

export const db = {
  profiles: {
    async getById(id: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as Profile
    },

    async create(profile: TablesInsert<'profiles'>) {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single()
      
      if (error) throw error
      return data as Profile
    },

    async update(id: string, updates: TablesUpdate<'profiles'>) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Profile
    }
  },

  properties: {
    async getByOwnerId(ownerId: string) {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Property[]
    },

    async getAvailable(checkIn: string, checkOut: string) {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          bookings!left(check_in, check_out)
        `)
        .eq('validation_status', 'approved')
        .not('bookings.check_in', 'lte', checkOut)
        .not('bookings.check_out', 'gte', checkIn)
      
      if (error) throw error
      return data as Property[]
    },

    async create(property: TablesInsert<'properties'>) {
      const { data, error } = await supabase
        .from('properties')
        .insert(property)
        .select()
        .single()
      
      if (error) throw error
      return data as Property
    }
  },

  bookings: {
    async getByTravelerId(travelerId: string) {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties(title, address, city, images)
        `)
        .eq('traveler_id', travelerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Booking[]
    },

    async create(booking: TablesInsert<'bookings'>) {
      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single()
      
      if (error) throw error
      return data as Booking
    }
  },

  services: {
    async getByCategory(category?: string) {
      let query = supabase
        .from('services')
        .select(`
          *,
          profiles(full_name, profile_validated)
        `)
        .eq('is_active', true)
        .eq('profiles.profile_validated', true)
      
      if (category) {
        query = query.eq('category', category)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Service[]
    },

    async getByProviderId(providerId: string) {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Service[]
    }
  },

  serviceRequests: {
    async getByRequesterId(requesterId: string) {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          services(name, category),
          profiles(full_name)
        `)
        .eq('requester_id', requesterId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as ServiceRequest[]
    },

    async create(serviceRequest: TablesInsert<'service_requests'>) {
      const { data, error } = await supabase
        .from('service_requests')
        .insert(serviceRequest)
        .select()
        .single()
      
      if (error) throw error
      return data as ServiceRequest
    }
  }
}

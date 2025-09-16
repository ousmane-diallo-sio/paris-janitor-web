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
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
      
      if (error) throw error
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
    },

    async update(id: string, updates: TablesUpdate<'properties'>) {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Property
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
      
      if (error) throw error
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
    async getAll() {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          profiles!provider_id(
            id,
            full_name,
            email,
            profile_validated,
            vip_subscription
          )
        `)
        .eq('is_active', true)
        .eq('profiles.profile_validated', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },

    async getByCategory(category?: string) {
      let query = supabase
        .from('services')
        .select(`
          *,
          profiles!provider_id(
            id,
            full_name,
            email,
            profile_validated,
            vip_subscription
          )
        `)
        .eq('is_active', true)
        .eq('profiles.profile_validated', true)
      
      if (category) {
        query = query.eq('category', category)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },

    async search(searchQuery: string, filters?: { category?: string; priceRange?: { min: number; max: number } }) {
      let query = supabase
        .from('services')
        .select(`
          *,
          profiles!provider_id(
            id,
            full_name,
            email,
            profile_validated,
            vip_subscription
          )
        `)
        .eq('is_active', true)
        .eq('profiles.profile_validated', true)
      
      // Search in name and description
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }
      
      // Filter by category
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      
      // Filter by price range
      if (filters?.priceRange) {
        if (filters.priceRange.min) {
          query = query.gte('base_price', filters.priceRange.min)
        }
        if (filters.priceRange.max) {
          query = query.lte('base_price', filters.priceRange.max)
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          profiles!provider_id(
            id,
            full_name,
            email,
            profile_validated,
            vip_subscription
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },

    async getByProviderId(providerId: string) {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Service[]
    },

    async create(service: TablesInsert<'services'>) {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single()
      
      if (error) throw error
      return data as Service
    },

    async update(id: string, updates: TablesUpdate<'services'>) {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Service
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
      
      if (error) throw error
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

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
        .from('bookings')
        .select(`
          *,
          properties!inner (
            id,
            title,
            owner_id
          )
        `)
        .eq('properties.owner_id', ownerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as (Booking & { properties: Property })[]
    },

    async getSubscriptionFees(ownerId: string, year?: number) {
      const currentYear = year || new Date().getFullYear()
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payer_id', ownerId)
        .eq('payment_type', 'subscription')
        .gte('created_at', `${currentYear}-01-01`)
        .lt('created_at', `${currentYear + 1}-01-01`)
      
      if (error) throw error
      return data || []
    },

    async createSubscriptionFee(ownerId: string, amount: number = 10000) {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          payer_id: ownerId,
          amount: amount,
          payment_type: 'subscription',
          status: 'pending',
          currency: 'EUR'
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async getBookedPropertiesByUser(userId: string) {
      const { data, error } = await supabase
      .from('bookings')
      .select('properties (*)')
      .eq('traveler_id', userId)
      .order('created_at', { ascending: false })
      
      if (error) throw error
      const props = (data ?? []).map((booking: any) => booking.properties).filter(Boolean) as Property[]
      const uniqueProperties = Array.from(new Map(props.map(p => [p.id, p])).values())
      return uniqueProperties as Property[]
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
    },

    async cancel(bookingId: string) {
      try {
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId)
        
        if (error) {
          if (error.code === '23502' && error.message.includes('http_request_queue')) {
            console.warn('HTTP request queue error during booking cancellation (non-critical):', error.message)
            return
          }
          throw error
        }
      } catch (error) {
        const dbError = error as { code?: string; message?: string }
        if (dbError?.code === '23502' && dbError?.message?.includes('http_request_queue')) {
          console.warn('HTTP request queue error during booking cancellation (non-critical):', dbError.message)
          return
        }
        throw error
      }
    }
  },

  reviews: {
    async getPropertyRatings(propertyIds: string[]) {
      if (propertyIds.length === 0) return {}

      interface ReviewWithBooking {
        rating: number
        bookings: {
          property_id: string
        }
      }

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          rating,
          bookings!inner(property_id)
        `)
        .in('bookings.property_id', propertyIds)
      
      if (error) {
        console.error('Error fetching property ratings:', error)
        return {}
      }

      const reviewsData = data as ReviewWithBooking[]
      
      // Calculate averages by grouping
      const propertyRatings: Record<string, number[]> = {}
      reviewsData?.forEach((review) => {
        const propertyId = review.bookings.property_id
        if (!propertyRatings[propertyId]) {
          propertyRatings[propertyId] = []
        }
        propertyRatings[propertyId].push(review.rating)
      })

      const ratingsMap: Record<string, { averageRating: number, reviewCount: number }> = {}
      Object.keys(propertyRatings).forEach(propertyId => {
        const ratings = propertyRatings[propertyId]
        const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        ratingsMap[propertyId] = {
          averageRating: Math.round(average * 10) / 10,
          reviewCount: ratings.length
        }
      })

      return ratingsMap
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
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }
      
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      
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
    },

    async update(id: string, updates: TablesUpdate<'service_requests'>) {
      const { data, error } = await supabase
        .from('service_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as ServiceRequest
    }
  },

  interventions: {
    async getByPropertyId(propertyId: string) {
      const { data, error } = await supabase
        .from('interventions')
        .select(`
          *,
          properties(title, address),
          profiles!interventions_provider_id_fkey(full_name, email)
        `)
        .eq('property_id', propertyId)
        .order('scheduled_date', { ascending: false })
      
      if (error) throw error
      return data
    },

    async getByProviderId(providerId: string) {
      const { data, error } = await supabase
        .from('interventions')
        .select(`
          *,
          properties(title, address, owner_id),
          profiles!interventions_property_owner_id_fkey(full_name, email)
        `)
        .eq('provider_id', providerId)
        .order('scheduled_date', { ascending: false })
      
      if (error) throw error
      return data
    },

    async create(intervention: TablesInsert<'interventions'>) {
      const { data, error } = await supabase
        .from('interventions')
        .insert(intervention)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async update(id: string, updates: TablesUpdate<'interventions'>) {
      const { data, error } = await supabase
        .from('interventions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async complete(id: string, reportData: {
      completion_date: string
      notes?: string
      before_photos?: string[]
      after_photos?: string[]
      duration_minutes?: number
      materials_used?: string[]
      issues_found?: string
      recommendations?: string
    }) {
      const { data, error } = await supabase
        .from('interventions')
        .update({
          ...reportData,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async validate(id: string, ownerId: string) {
      const { data, error } = await supabase
        .from('interventions')
        .update({
          status: 'validated',
          validated_by: ownerId,
          validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async rate(interventionId: string, rating: {
      rating: number
      comment?: string
      quality_rating: number
      punctuality_rating: number
      communication_rating: number
    }) {
      const { data, error } = await supabase
        .from('interventions')
        .update({
          rating: rating.rating,
          rating_comment: rating.comment,
          quality_rating: rating.quality_rating,
          punctuality_rating: rating.punctuality_rating,
          communication_rating: rating.communication_rating,
          rated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', interventionId)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  }
}

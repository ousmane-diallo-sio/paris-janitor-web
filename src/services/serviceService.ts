import { db } from '@/lib/database'
import type { 
  ServiceWithProvider, 
  ServiceFilters,
  ServiceSearchParams
} from '@/types/services'
import type { Service, ServiceRequest } from '@/types/database'

// Type for Supabase query result with joined provider data
type ServiceWithProviderData = Service & {
  profiles: {
    id: string
    full_name: string | null
    email: string
    profile_validated: boolean | null
    vip_subscription: boolean | null
  } | null
}

/**
 * Service layer for handling service operations
 * Follows AGENTS.md patterns for clean separation of concerns
 */
export class ServiceService {
  /**
   * Get all active services with provider information
   */
  static async getAllServices(): Promise<ServiceWithProvider[]> {
    const data = await db.services.getAll()
    return this.transformServicesWithProvider(data)
  }

  /**
   * Get services by category
   */
  static async getServicesByCategory(category: string): Promise<ServiceWithProvider[]> {
    const data = await db.services.getByCategory(category)
    return this.transformServicesWithProvider(data)
  }

  /**
   * Search services with filters
   */
  static async searchServices(params: ServiceSearchParams): Promise<ServiceWithProvider[]> {
    const { query = '', filters } = params
    
    const searchFilters = {
      category: filters?.category,
      priceRange: filters?.priceRange
    }

    const data = await db.services.search(query, searchFilters)
    return this.transformServicesWithProvider(data)
  }

  /**
   * Get service by ID with provider information
   */
  static async getServiceById(id: string): Promise<ServiceWithProvider | null> {
    try {
      const data = await db.services.getById(id)
      return this.transformServiceWithProvider(data)
    } catch (error) {
      console.error('Service not found:', error)
      return null
    }
  }

  /**
   * Get services for a specific provider
   */
  static async getServicesByProvider(providerId: string): Promise<Service[]> {
    return await db.services.getByProviderId(providerId)
  }

  /**
   * Create a new service
   */
  static async createService(serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> {
    const now = new Date().toISOString()
    
    const service = {
      ...serviceData,
      created_at: now,
      updated_at: now,
      is_active: serviceData.is_active ?? true
    }

    return await db.services.create(service)
  }

  /**
   * Update an existing service
   */
  static async updateService(id: string, updates: Partial<Omit<Service, 'id' | 'created_at'>>): Promise<Service> {
    const serviceUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    return await db.services.update(id, serviceUpdates)
  }

  /**
   * Delete a service (soft delete by setting is_active to false)
   */
  static async deleteService(id: string): Promise<void> {
    await db.services.update(id, { 
      is_active: false,
      updated_at: new Date().toISOString()
    })
  }

  /**
   * Get service requests for a specific requester
   */
  static async getServiceRequestsByRequester(requesterId: string): Promise<ServiceRequest[]> {
    return await db.serviceRequests.getByRequesterId(requesterId)
  }

  /**
   * Create a new service request
   */
  static async createServiceRequest(
    requestData: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at' | 'status'>
  ): Promise<ServiceRequest> {
    const now = new Date().toISOString()
    
    const serviceRequest = {
      ...requestData,
      status: 'pending',
      created_at: now,
      updated_at: now
    }

    return await db.serviceRequests.create(serviceRequest)
  }

  /**
   * Filter services by various criteria
   */
  static filterServices(
    services: ServiceWithProvider[], 
    filters: ServiceFilters
  ): ServiceWithProvider[] {
    let filtered = [...services]

    // Filter by price range (considering minimum price for variable pricing)
    if (filters.priceRange) {
      filtered = filtered.filter(service => {
        const minPrice = this.getServiceMinPrice(service)
        const maxPrice = service.base_price
        
        const { min = 0, max = Infinity } = filters.priceRange!
        return minPrice >= min && maxPrice <= max
      })
    }

    // Filter by availability (placeholder - would need provider schedule data)
    if (filters.available !== undefined) {
      // TODO: Implement availability filtering based on provider schedules
      // For now, assume all services are available if is_active is true
      filtered = filtered.filter(service => service.is_active === filters.available)
    }

    // Filter by minimum rating (placeholder - would need review data)
    if (filters.rating) {
      // TODO: Implement rating filtering based on review data
      // For now, include all services (would require avg_rating calculation)
    }

    return filtered
  }

  /**
   * Sort services by various criteria
   */
  static sortServices(
    services: ServiceWithProvider[],
    sortBy: 'price' | 'rating' | 'name' | 'distance' = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): ServiceWithProvider[] {
    const sorted = [...services]

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'price':
          comparison = a.base_price - b.base_price
          break
        case 'rating':
          // TODO: Implement rating-based sorting
          comparison = (a.avg_rating || 0) - (b.avg_rating || 0)
          break
        case 'name':
          comparison = a.name.localeCompare(b.name, 'fr-FR')
          break
        case 'distance':
          // TODO: Implement distance-based sorting (requires location data)
          comparison = 0
          break
        default:
          comparison = 0
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    return sorted
  }

  /**
   * Get minimum price for a service (used for filtering)
   */
  private static getServiceMinPrice(service: Service): number {
    switch (service.price_type) {
      case 'hourly':
        return service.base_price * 0.5 // 30 minutes minimum
      case 'distance':
        return service.base_price * 1 // 1km minimum
      default:
        return service.base_price
    }
  }

  /**
   * Transform raw service data with provider information
   */
  private static transformServicesWithProvider(data: ServiceWithProviderData[]): ServiceWithProvider[] {
    return data.map(item => this.transformServiceWithProvider(item))
  }

  /**
   * Transform single service data with provider information
   */
  private static transformServiceWithProvider(item: ServiceWithProviderData): ServiceWithProvider {
    const { profiles, ...service } = item
    
    return {
      ...service,
      provider: {
        id: profiles?.id || '',
        full_name: profiles?.full_name || 'Prestataire inconnu',
        email: profiles?.email || '',
        profile_validated: profiles?.profile_validated || false,
        vip_subscription: profiles?.vip_subscription || false
      },
      // TODO: Calculate from reviews table
      avg_rating: undefined,
      total_reviews: undefined
    } as ServiceWithProvider
  }
}
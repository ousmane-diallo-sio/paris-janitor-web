import { z } from 'zod'
import type { Service, ServiceRequest } from './database'

// Service Categories as defined in AGENTS.md
export const SERVICE_CATEGORIES = {
  CLEANING: 'cleaning',
  MAINTENANCE: 'maintenance', 
  CONCIERGE: 'concierge'
} as const

export type ServiceCategory = typeof SERVICE_CATEGORIES[keyof typeof SERVICE_CATEGORIES]

// Price Types for different service models
export const PRICE_TYPES = {
  FIXED: 'fixed',           // Fixed price per service
  HOURLY: 'hourly',         // Price per hour
  DISTANCE: 'distance',     // Price per km (for taxi-like services)
  VARIABLE: 'variable'      // Custom pricing logic
} as const

export type PriceType = typeof PRICE_TYPES[keyof typeof PRICE_TYPES]

// Service Request Status
export const SERVICE_REQUEST_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected', 
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export type ServiceRequestStatus = typeof SERVICE_REQUEST_STATUSES[keyof typeof SERVICE_REQUEST_STATUSES]

// Extended Service type with provider information
export interface ServiceWithProvider extends Service {
  provider: {
    id: string
    full_name: string | null
    email: string
    profile_validated: boolean | null
    vip_subscription: boolean | null
  }
  avg_rating?: number
  total_reviews?: number
}

// Extended Service Request with related data
export interface ServiceRequestWithDetails extends ServiceRequest {
  service: ServiceWithProvider
  property?: {
    id: string
    title: string
    address: string
    city: string
  }
  requester: {
    id: string
    full_name: string | null
    email: string
  }
}

// Service Categories with metadata
export const SERVICE_CATEGORY_CONFIG = {
  [SERVICE_CATEGORIES.CLEANING]: {
    label: 'Nettoyage',
    icon: '🧹',
    description: 'Services de nettoyage et entretien',
    color: 'blue'
  },
  [SERVICE_CATEGORIES.MAINTENANCE]: {
    label: 'Maintenance',
    icon: '🔧', 
    description: 'Réparations et maintenance technique',
    color: 'orange'
  },
  [SERVICE_CATEGORIES.CONCIERGE]: {
    label: 'Conciergerie',
    icon: '🏨',
    description: 'Services de conciergerie et assistance',
    color: 'purple'
  }
} as const

// Common qualifications for services
export const COMMON_QUALIFICATIONS = [
  'cleaning_certified',
  'electrical_certified', 
  'plumbing_certified',
  'locksmith_certified',
  'first_aid_certified',
  'insurance_covered',
  'background_checked'
] as const

// Validation Schemas using Zod (following AGENTS.md patterns)

export const serviceSchema = z.object({
  name: z.string().min(3, 'Le nom du service doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  category: z.enum([
    SERVICE_CATEGORIES.CLEANING,
    SERVICE_CATEGORIES.MAINTENANCE, 
    SERVICE_CATEGORIES.CONCIERGE
  ]),
  base_price: z.number().min(0, 'Le prix doit être positif').max(10000, 'Prix maximum: 10000€'),
  price_type: z.enum([
    PRICE_TYPES.FIXED,
    PRICE_TYPES.HOURLY,
    PRICE_TYPES.DISTANCE,
    PRICE_TYPES.VARIABLE
  ]).optional(),
  duration_minutes: z.number().min(15, 'Durée minimum: 15 minutes').max(480, 'Durée maximum: 8 heures').optional(),
  qualifications_required: z.array(z.string()).optional(),
  is_active: z.boolean().optional().default(true)
})

export const serviceRequestSchema = z.object({
  service_id: z.string().uuid('ID de service invalide'),
  property_id: z.string().uuid('ID de propriété invalide').optional(),
  requested_date: z.string().datetime('Date invalide'),
  quantity: z.number().min(1, 'Quantité minimum: 1').max(10, 'Quantité maximum: 10').optional(),
  distance_km: z.number().min(0, 'Distance invalide').max(100, 'Distance maximum: 100km').optional(),
  duration_minutes: z.number().min(15, 'Durée minimum: 15 minutes').max(480, 'Durée maximum: 8 heures').optional(),
  notes: z.string().max(500, 'Notes trop longues (maximum 500 caractères)').optional(),
  total_amount: z.number().min(0, 'Montant invalide')
})

// Form data types for React Hook Form
export type ServiceFormData = z.infer<typeof serviceSchema>
export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>

// Search and filter types
export interface ServiceFilters {
  category?: ServiceCategory
  priceRange?: {
    min: number
    max: number
  }
  location?: string
  available?: boolean
  rating?: number
}

export interface ServiceSearchParams {
  query?: string
  filters?: ServiceFilters
  sortBy?: 'price' | 'rating' | 'name' | 'distance'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Pricing calculation types
export interface PricingCalculation {
  basePrice: number
  distance?: number
  duration?: number
  quantity?: number
  commission: number // 20% as per AGENTS.md
  vipDiscount?: number
  total: number
  breakdown: {
    label: string
    amount: number
  }[]
}

// Commission configuration (20% as per AGENTS.md)
export const COMMISSION_RATE = 0.20
export const VIP_DISCOUNT_RATE = 0.10 // 10% discount for VIP travelers

// Helper functions for service categories
export const getServiceCategoryConfig = (category: ServiceCategory) => {
  return SERVICE_CATEGORY_CONFIG[category]
}

export const getServiceCategories = () => {
  return Object.values(SERVICE_CATEGORIES)
}

export const getServiceCategoryOptions = () => {
  return getServiceCategories().map(category => ({
    value: category,
    label: SERVICE_CATEGORY_CONFIG[category].label,
    icon: SERVICE_CATEGORY_CONFIG[category].icon,
    description: SERVICE_CATEGORY_CONFIG[category].description
  }))
}

// Service status helpers
export const getServiceRequestStatusConfig = (status: ServiceRequestStatus) => {
  const configs = {
    [SERVICE_REQUEST_STATUSES.PENDING]: {
      label: 'En attente',
      variant: 'default' as const,
      color: 'yellow'
    },
    [SERVICE_REQUEST_STATUSES.PAID]: {
      label: 'Payé - En attente',
      variant: 'secondary' as const,
      color: 'blue'
    },
    [SERVICE_REQUEST_STATUSES.ACCEPTED]: {
      label: 'Accepté',
      variant: 'secondary' as const,
      color: 'green'
    },
    [SERVICE_REQUEST_STATUSES.REJECTED]: {
      label: 'Refusé',
      variant: 'destructive' as const,
      color: 'red'
    },
    [SERVICE_REQUEST_STATUSES.IN_PROGRESS]: {
      label: 'En cours',
      variant: 'default' as const,
      color: 'orange'
    },
    [SERVICE_REQUEST_STATUSES.COMPLETED]: {
      label: 'Terminé',
      variant: 'outline' as const,
      color: 'green'
    },
    [SERVICE_REQUEST_STATUSES.CANCELLED]: {
      label: 'Annulé',
      variant: 'destructive' as const,
      color: 'gray'
    }
  }
  
  return configs[status] || configs[SERVICE_REQUEST_STATUSES.PENDING]
}
import type { Database } from "./supabase"


export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type Property = Tables<'properties'>
export type Booking = Tables<'bookings'>
export type Service = Tables<'services'>
export type ServiceRequest = Tables<'service_requests'>
export type Intervention = Tables<'interventions'>
export type Payment = Tables<'payments'>
export type Review = Tables<'reviews'>
export type Subscription = Tables<'subscriptions'>
export type Notification = Tables<'notifications'>

export type UserRole = 'property_owner' | 'traveler' | 'service_provider'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type ServiceRequestStatus = 'pending' | 'paid' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
export type PropertyValidationStatus = 'pending' | 'approved' | 'rejected'
export type InterventionStatus = 'scheduled' | 'in_progress' | 'completed' | 'validated'
export type InterventionType = 'cleaning' | 'maintenance' | 'repair' | 'check_in' | 'check_out' | 'other'

export interface InterventionReport {
  id: string
  intervention_id: string
  provider_id: string
  property_id: string
  intervention_type: InterventionType
  scheduled_date: string
  completion_date?: string
  status: InterventionStatus
  description: string
  notes?: string
  before_photos?: string[]
  after_photos?: string[]
  duration_minutes?: number
  materials_used?: string[]
  issues_found?: string
  recommendations?: string
  created_at: string
  updated_at: string
}

export interface InterventionRating {
  id: string
  intervention_id: string
  property_owner_id: string
  provider_id: string
  rating: number
  comment?: string
  quality_rating: number
  punctuality_rating: number
  communication_rating: number
  created_at: string
}

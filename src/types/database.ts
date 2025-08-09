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
export type PaymentStatus = 'pending' | 'paid' | 'refunded'
export type ServiceRequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
export type PropertyValidationStatus = 'pending' | 'approved' | 'rejected'

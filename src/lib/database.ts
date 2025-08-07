import { supabase } from './supabase'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export const getProperties = async (ownerId?: string) => {
  let query = supabase
    .from('properties')
    .select('*')
  
  if (ownerId) {
    query = query.eq('owner_id', ownerId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

export const createProperty = async (property: Tables['properties']['Insert']) => {
  const { data, error } = await supabase
    .from('properties')
    .insert(property)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getBookings = async (userId?: string, role?: string) => {
  let query = supabase
    .from('bookings')
    .select('*')
  
  if (userId && role === 'property_owner') {
    query = query.eq('property.owner_id', userId)
  } else if (userId && role === 'traveler') {
    query = query.eq('traveler_id', userId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

export const getServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
  
  if (error) throw error
  return data
}

export const createServiceRequest = async (request: Tables['service_requests']['Insert']) => {
  const { data, error } = await supabase
    .from('service_requests')
    .insert(request)
    .select()
    .single()
  
  if (error) throw error
  return data
}

import { supabase } from '@/lib/supabase'

export interface OwnerMetrics {
  totalProperties: number
  approvedProperties: number
  monthlyRevenue: number
  occupationRate: number
}

/**
 * Calculate comprehensive metrics for property owner dashboard
 * @param ownerId - The property owner's user ID
 * @returns Promise containing all calculated metrics
 */
export async function calculateOwnerMetrics(ownerId: string): Promise<OwnerMetrics> {
  try {
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)

    if (propertiesError) throw propertiesError

    const allProperties = properties || []
    const totalProperties = allProperties.length
    const approvedProperties = allProperties.filter(p => p.validation_status === 'approved').length

    if (totalProperties === 0) {
      return {
        totalProperties: 0,
        approvedProperties: 0,
        monthlyRevenue: 0,
        occupationRate: 0
      }
    }

    const propertyIds = allProperties.map(p => p.id)

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const monthStart = new Date(currentYear, currentMonth, 1)
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)

    const { data: monthlyBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .in('property_id', propertyIds)
      .gte('check_in', monthStart.toISOString())
      .lte('check_out', monthEnd.toISOString())

    if (bookingsError) throw bookingsError

    const monthlyRevenue = (monthlyBookings || []).reduce((total, booking) => {
      return total + (booking.commission_amount || 0)
    }, 0)

    const occupationRate = await calculateOccupationRate(propertyIds, monthStart, monthEnd)

    return {
      totalProperties,
      approvedProperties,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      occupationRate: Math.round(occupationRate * 100) / 100
    }
  } catch (error) {
    console.error('Error calculating owner metrics:', error)
    throw error
  }
}

/**
 * Calculate occupation rate for properties in a given time period
 * @param propertyIds - Array of property IDs to analyze
 * @param startDate - Start of period
 * @param endDate - End of period
 * @returns Occupation rate as percentage (0-100)
 */
async function calculateOccupationRate(
  propertyIds: string[], 
  startDate: Date, 
  endDate: Date
): Promise<number> {
  if (propertyIds.length === 0) return 0

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('check_in, check_out, property_id')
      .in('property_id', propertyIds)
      .in('status', ['confirmed', 'completed'])
      .gte('check_out', startDate.toISOString())
      .lte('check_in', endDate.toISOString())

    if (error) throw error

    if (!bookings || bookings.length === 0) return 0

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const totalPropertyDays = totalDays * propertyIds.length

    let occupiedDays = 0
    
    bookings.forEach(booking => {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)
      
      const actualStart = new Date(Math.max(checkIn.getTime(), startDate.getTime()))
      const actualEnd = new Date(Math.min(checkOut.getTime(), endDate.getTime()))
      
      if (actualStart < actualEnd) {
        const days = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24))
        occupiedDays += days
      }
    })

    return totalPropertyDays > 0 ? (occupiedDays / totalPropertyDays) * 100 : 0
  } catch (error) {
    console.error('Error calculating occupation rate:', error)
    return 0
  }
}

/**
 * Format revenue amount for display
 * @param amount - Amount in euros
 * @returns Formatted string with euro symbol
 */
export function formatRevenue(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format occupation rate for display
 * @param rate - Rate as percentage (0-100)
 * @returns Formatted string with percentage symbol
 */
export function formatOccupationRate(rate: number): string {
  return `${rate.toFixed(1)}%`
}

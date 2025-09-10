import { supabase } from '@/lib/supabase'
import { addDays, isSameDay, parseISO, format, startOfDay, endOfDay } from 'date-fns'

export interface AvailabilityPeriod {
  start: Date
  end: Date
  available: boolean
  reason?: string // For unavailable periods
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: 'booking' | 'unavailable' | 'available'
  resource?: {
    id?: string
    [key: string]: unknown
  }
}

export interface AvailabilityCalendar {
  [propertyId: string]: AvailabilityPeriod[]
}

/**
 * Get availability calendar data for a property
 * @param propertyId - Property ID
 * @returns Array of availability periods
 */
export async function getPropertyAvailability(propertyId: string): Promise<AvailabilityPeriod[]> {
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .select('availability_calendar')
      .eq('id', propertyId)
      .single()

    if (error) throw error

    if (!property?.availability_calendar) {
      return []
    }

    const calendar = property.availability_calendar as Array<{
      start: string
      end: string
      available: boolean
      reason?: string
    }>
    return calendar.map((period) => ({
      start: parseISO(period.start),
      end: parseISO(period.end),
      available: period.available,
      reason: period.reason
    }))
  } catch (error) {
    console.error('Error fetching property availability:', error)
    return []
  }
}

/**
 * Update availability calendar for a property
 * @param propertyId - Property ID
 * @param periods - Array of availability periods
 */
export async function updatePropertyAvailability(
  propertyId: string,
  periods: AvailabilityPeriod[]
): Promise<void> {
  try {
    const calendarData = periods.map(period => ({
      start: period.start.toISOString(),
      end: period.end.toISOString(),
      available: period.available,
      reason: period.reason
    }))

    const { error } = await supabase
      .from('properties')
      .update({ availability_calendar: calendarData })
      .eq('id', propertyId)

    if (error) throw error
  } catch (error) {
    console.error('Error updating property availability:', error)
    throw error
  }
}

/**
 * Get calendar events for a property (bookings + availability)
 * @param propertyId - Property ID
 * @param startDate - Start date for the range
 * @param endDate - End date for the range
 * @returns Array of calendar events
 */
export async function getPropertyCalendarEvents(
  propertyId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  try {
    const events: CalendarEvent[] = []

    // Get confirmed bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('property_id', propertyId)
      .in('status', ['confirmed', 'completed'])
      .gte('check_out', startDate.toISOString())
      .lte('check_in', endDate.toISOString())

    if (bookingsError) throw bookingsError

    // Add booking events
    bookings?.forEach(booking => {
      events.push({
        id: `booking-${booking.id}`,
        title: `Réservation`,
        start: parseISO(booking.check_in),
        end: parseISO(booking.check_out),
        type: 'booking',
        resource: booking
      })
    })

    // Get availability periods
    const availability = await getPropertyAvailability(propertyId)
    
    // Add unavailable periods
    availability
      .filter(period => !period.available)
      .forEach((period, index) => {
        events.push({
          id: `unavailable-${index}`,
          title: period.reason || 'Indisponible',
          start: period.start,
          end: period.end,
          type: 'unavailable',
          resource: { 
            ...period,
            id: `period-${index}` 
          }
        })
      })

    return events
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return []
  }
}

/**
 * Block/unblock dates for a property
 * @param propertyId - Property ID
 * @param startDate - Start date
 * @param endDate - End date
 * @param available - Whether to make dates available or unavailable
 * @param reason - Reason for unavailability (optional)
 */
export async function setPropertyAvailability(
  propertyId: string,
  startDate: Date,
  endDate: Date,
  available: boolean,
  reason?: string
): Promise<void> {
  try {
    // Get existing availability
    const existingPeriods = await getPropertyAvailability(propertyId)
    
    // Remove overlapping periods
    const filteredPeriods = existingPeriods.filter(period => {
      return !(
        (startDate <= period.end && endDate >= period.start)
      )
    })

    // Add new period
    const newPeriod: AvailabilityPeriod = {
      start: startOfDay(startDate),
      end: endOfDay(endDate),
      available,
      reason: available ? undefined : (reason || 'Période bloquée')
    }

    const updatedPeriods = [...filteredPeriods, newPeriod]

    // Update in database
    await updatePropertyAvailability(propertyId, updatedPeriods)
  } catch (error) {
    console.error('Error setting property availability:', error)
    throw error
  }
}

/**
 * Check if a property is available for specific dates
 * @param propertyId - Property ID
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @returns True if available, false otherwise
 */
export async function checkPropertyAvailability(
  propertyId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  try {
    // Check for existing bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('check_in, check_out')
      .eq('property_id', propertyId)
      .in('status', ['confirmed', 'completed'])
      .gte('check_out', checkIn.toISOString())
      .lte('check_in', checkOut.toISOString())

    if (bookingsError) throw bookingsError

    if (bookings && bookings.length > 0) {
      return false // Property is booked
    }

    // Check availability calendar
    const availability = await getPropertyAvailability(propertyId)
    
    for (const period of availability) {
      if (!period.available) {
        // Check if the requested period overlaps with unavailable period
        if (checkIn <= period.end && checkOut >= period.start) {
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error('Error checking property availability:', error)
    return false
  }
}

/**
 * Format date range for display
 * @param start - Start date
 * @param end - End date
 * @returns Formatted date range string
 */
export function formatDateRange(start: Date, end: Date): string {
  const startStr = format(start, 'dd/MM/yyyy')
  const endStr = format(end, 'dd/MM/yyyy')
  
  if (isSameDay(start, end)) {
    return startStr
  }
  
  return `${startStr} - ${endStr}`
}

/**
 * Generate date range array
 * @param start - Start date
 * @param end - End date
 * @returns Array of dates in the range
 */
export function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  let current = new Date(start)
  
  while (current <= end) {
    dates.push(new Date(current))
    current = addDays(current, 1)
  }
  
  return dates
}

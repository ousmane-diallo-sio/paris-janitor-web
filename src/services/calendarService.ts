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

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('property_id', propertyId)
      .in('status', ['confirmed', 'completed'])
      .gte('check_out', startDate.toISOString())
      .lte('check_in', endDate.toISOString())

    if (bookingsError) throw bookingsError

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

    const availability = await getPropertyAvailability(propertyId)
    
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
    const existingPeriods = await getPropertyAvailability(propertyId)    
    const filteredPeriods = existingPeriods.filter(period => {
      return !(
        (startDate <= period.end && endDate >= period.start)
      )
    })

    const newPeriod: AvailabilityPeriod = {
      start: startOfDay(startDate),
      end: endOfDay(endDate),
      available,
      reason: available ? undefined : (reason || 'Période bloquée')
    }

    const updatedPeriods = [...filteredPeriods, newPeriod]

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
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('check_in, check_out')
      .eq('property_id', propertyId)
      .in('status', ['confirmed', 'completed'])
      .gte('check_out', checkIn.toISOString())
      .lte('check_in', checkOut.toISOString())

    if (bookingsError) throw bookingsError

    if (bookings && bookings.length > 0) {
      return false
    }

    const availability = await getPropertyAvailability(propertyId)
    
    for (const period of availability) {
      if (!period.available) {
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

/**
 * Get provider availability data
 * Note: For now, we'll store availability in a separate table in the future
 * @param _providerId - Service provider ID (unused for now)
 * @returns Array of availability periods
 */
export async function getProviderAvailability(_providerId: string): Promise<AvailabilityPeriod[]> {
  try {
    return []
  } catch (error) {
    console.error('Error fetching provider availability:', error)
    return []
  }
}

/**
 * Update provider availability calendar
 * Note: For now, we'll store availability in a separate table in the future
 * @param _providerId - Service provider ID (unused for now)
 * @param _periods - Array of availability periods (unused for now)
 */
export async function updateProviderAvailability(
  _providerId: string,
  _periods: AvailabilityPeriod[]
): Promise<void> {
  try {
    console.log('Provider availability update not implemented yet')
  } catch (error) {
    console.error('Error updating provider availability:', error)
    throw error
  }
}

/**
 * Get calendar events for a service provider (service requests + availability)
 * @param providerId - Service provider ID
 * @param startDate - Start date for the range
 * @param endDate - End date for the range
 * @returns Array of calendar events
 */
export async function getProviderCalendarEvents(
  providerId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  try {
    const events: CalendarEvent[] = []

    const { data: serviceRequests, error: requestsError } = await supabase
      .from('service_requests')
      .select(`
        id,
        status,
        scheduled_date,
        total_amount,
        service_id,
        property_id,
        notes
      `)
      .eq('provider_id', providerId)
      .in('status', ['confirmed', 'in_progress', 'completed'])
      .gte('scheduled_date', startDate.toISOString())
      .lte('scheduled_date', endDate.toISOString())

    if (requestsError) throw requestsError

    if (serviceRequests) {
      for (const request of serviceRequests) {
        if (!request.scheduled_date) continue
        
        const scheduledDate = parseISO(request.scheduled_date)
        const endDate = new Date(scheduledDate)
        endDate.setHours(scheduledDate.getHours() + 2)

        let serviceTitle = 'Service'
        let propertyTitle = 'Propriété'

        if (request.service_id) {
          const { data: service } = await supabase
            .from('services')
            .select('name')
            .eq('id', request.service_id)
            .single()
          
          if (service) serviceTitle = service.name
        }

        if (request.property_id) {
          const { data: property } = await supabase
            .from('properties')
            .select('title')
            .eq('id', request.property_id)
            .single()
          
          if (property) propertyTitle = property.title
        }

        events.push({
          id: `service-${request.id}`,
          title: `${serviceTitle} - ${propertyTitle}`,
          start: scheduledDate,
          end: endDate,
          type: 'booking',
          resource: {
            ...request,
            serviceTitle,
            propertyTitle
          }
        })
      }
    }

    return events
  } catch (error) {
    console.error('Error fetching provider calendar events:', error)
    return []
  }
}

/**
 * Set provider availability for specific dates
 * Note: For now, this is a placeholder function
 * @param _providerId - Service provider ID (unused for now)
 * @param _startDate - Start date (unused for now)
 * @param _endDate - End date (unused for now)
 * @param _available - Whether to make dates available or unavailable (unused for now)
 * @param _reason - Reason for unavailability (unused for now)
 */
export async function setProviderAvailability(
  _providerId: string,
  _startDate: Date,
  _endDate: Date,
  _available: boolean,
  _reason?: string
): Promise<void> {
  try {
    console.log('Provider availability setting not implemented yet')
  } catch (error) {
    console.error('Error setting provider availability:', error)
    throw error
  }
}

/**
 * Check if a provider is available for a specific date and time
 * @param providerId - Service provider ID
 * @param scheduledDate - Date and time for the service
 * @returns True if available, false otherwise
 */
export async function checkProviderAvailability(
  providerId: string,
  scheduledDate: Date
): Promise<boolean> {
  try {
    const { data: serviceRequests, error: requestsError } = await supabase
      .from('service_requests')
      .select('scheduled_date')
      .eq('provider_id', providerId)
      .in('status', ['confirmed', 'in_progress'])
      .gte('scheduled_date', startOfDay(scheduledDate).toISOString())
      .lte('scheduled_date', endOfDay(scheduledDate).toISOString())

    if (requestsError) throw requestsError

    if (serviceRequests && serviceRequests.length > 0) {
      return false
    }

    return true
  } catch (error) {
    console.error('Error checking provider availability:', error)
    return false
  }
}

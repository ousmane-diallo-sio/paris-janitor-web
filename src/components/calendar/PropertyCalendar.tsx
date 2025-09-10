import { useState, useCallback, useEffect } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import type { View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Plus } from 'lucide-react'
import { 
  getPropertyCalendarEvents, 
  setPropertyAvailability, 
  type CalendarEvent 
} from '@/services/calendarService'
import { AvailabilityDialog } from './AvailabilityDialog'
import type { Property } from '@/types/database'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'fr': fr,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface PropertyCalendarProps {
  property: Property
  onRefresh?: () => void
}

interface SelectedSlot {
  start: Date
  end: Date
  action?: 'block' | 'unblock'
}

export function PropertyCalendar({ property, onRefresh }: PropertyCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false)

  const loadEvents = useCallback(async () => {
    if (!property.id) return

    try {
      setLoading(true)
      
      // Calculate range based on current view
      const startDate = new Date(date.getFullYear(), date.getMonth() - 1, 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 2, 0)
      
      const calendarEvents = await getPropertyCalendarEvents(property.id, startDate, endDate)
      setEvents(calendarEvents)
    } catch (error) {
      console.error('Error loading calendar events:', error)
    } finally {
      setLoading(false)
    }
  }, [property.id, date])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Handle browser navigation - component will unmount naturally when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clean up any pending operations if needed
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end })
    setShowAvailabilityDialog(true)
  }, [])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (event.type === 'unavailable') {
      // Allow editing of unavailable periods
      setSelectedSlot({ 
        start: event.start, 
        end: event.end, 
        action: 'unblock' 
      })
      setShowAvailabilityDialog(true)
    }
  }, [])

  const handleSetAvailability = async (
    start: Date, 
    end: Date, 
    available: boolean, 
    reason?: string
  ) => {
    try {
      await setPropertyAvailability(property.id, start, end, available, reason)
      await loadEvents()
      onRefresh?.()
      setShowAvailabilityDialog(false)
      setSelectedSlot(null)
    } catch (error) {
      console.error('Error setting availability:', error)
    }
  }

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    let backgroundColor = '#3174ad'
    let color = 'white'

    switch (event.type) {
      case 'booking':
        backgroundColor = '#059669' // Emerald green for confirmed bookings
        color = 'white'
        break
      case 'unavailable':
        backgroundColor = '#dc2626' // Rose red for unavailable periods
        color = 'white'
        break
      case 'available':
        backgroundColor = '#6b7280' // Gray for available periods
        color = 'white'
        break
    }

    return {
      style: {
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500'
      }
    }
  }, [])

  const messages = {
    allDay: 'Journée entière',
    previous: 'Précédent',
    next: 'Suivant',
    today: "Aujourd'hui",
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
    agenda: 'Agenda',
    date: 'Date',
    time: 'Heure',
    event: 'Événement',
    noEventsInRange: 'Aucun événement dans cette période',
    showMore: (total: number) => `+ ${total} de plus`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Calendrier - {property.title}</span>
            </CardTitle>
            <div className="flex items-center">
              <Button
                size="sm"
                onClick={() => setShowAvailabilityDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Bloquer des dates
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Chargement du calendrier...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-emerald-600 rounded"></div>
                  <span>Réservations confirmées</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span>Périodes bloquées</span>
                </div>
              </div>

              {/* Calendar */}
              <div className="h-[600px]">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  titleAccessor="title"
                  view={view}
                  onView={setView}
                  date={date}
                  onNavigate={setDate}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  selectable
                  popup
                  eventPropGetter={eventStyleGetter}
                  messages={messages}
                  culture="fr"
                  formats={{
                    dateFormat: 'dd',
                    dayFormat: (date: Date, culture?: string) => 
                      localizer.format(date, 'EEEE', culture),
                    dayHeaderFormat: (date: Date, culture?: string) =>
                      localizer.format(date, 'EEEE dd/MM', culture),
                    monthHeaderFormat: (date: Date, culture?: string) =>
                      localizer.format(date, 'MMMM yyyy', culture)
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Availability Dialog */}
      {showAvailabilityDialog && (
        <AvailabilityDialog
          isOpen={showAvailabilityDialog}
          onClose={() => {
            setShowAvailabilityDialog(false)
            setSelectedSlot(null)
          }}
          onConfirm={handleSetAvailability}
          initialDates={selectedSlot}
          propertyTitle={property.title}
        />
      )}
    </div>
  )
}

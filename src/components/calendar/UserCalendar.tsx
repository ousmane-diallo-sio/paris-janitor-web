import { useState, useCallback, useEffect } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import type { View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Plus } from 'lucide-react'
import { 
  getPropertyCalendarEvents, 
  getProviderCalendarEvents,
  setPropertyAvailability, 
  type CalendarEvent 
} from '@/services/calendarService'
import { AvailabilityDialog } from './AvailabilityDialog'
import { notify, logError } from '@/lib/error-handling'
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
  property?: Property
  providerId?: string
  mode: 'property' | 'provider'
  onRefresh?: () => void
}

interface SelectedSlot {
  start: Date
  end: Date
  action?: 'block' | 'unblock'
}

export function UserCalendar({ property, providerId, mode, onRefresh }: PropertyCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false)

  const entityId = property?.id || providerId
  const entityTitle = property?.title || 'Mon Planning'

  const loadEvents = useCallback(async () => {
    if (!entityId) return

    try {
      setLoading(true)
      
      const startDate = new Date(date.getFullYear(), date.getMonth() - 1, 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 2, 0)
      
      if (mode === 'property' && property?.id) {
        const calendarEvents = await getPropertyCalendarEvents(property.id, startDate, endDate)
        setEvents(calendarEvents)
      } else if (mode === 'provider' && providerId) {
        const calendarEvents = await getProviderCalendarEvents(providerId, startDate, endDate)
        setEvents(calendarEvents)
      }
    } catch (error) {
      logError(error, 'UserCalendar.loadEvents')
      notify.error(error, {
        label: 'Réessayer',
        onClick: () => loadEvents()
      })
    } finally {
      setLoading(false)
    }
  }, [entityId, date, mode, property?.id, providerId])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    const handleBeforeUnload = () => {}

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end })
    setShowAvailabilityDialog(true)
  }, [])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (event.type === 'unavailable') {
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
    if (!entityId) return

    try {
      if (mode === 'property' && property?.id) {
        await setPropertyAvailability(property.id, start, end, available, reason)
      } else if (mode === 'provider' && providerId) {
        // TODO: Implement setProviderAvailability
        console.log('Provider availability setting not implemented yet')
      }
      
      await loadEvents()
      onRefresh?.()
      setShowAvailabilityDialog(false)
      setSelectedSlot(null)
      
      const actionText = available ? 'disponible' : 'indisponible'
      const entityText = mode === 'property' ? 'Calendrier' : 'Planning'
      notify.success(`${entityText} mis à jour - Période marquée comme ${actionText}`)
    } catch (error) {
      logError(error, 'UserCalendar.handleSetAvailability')
      notify.error(error, {
        label: 'Réessayer',
        onClick: () => handleSetAvailability(start, end, available, reason)
      })
    }
  }

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    let backgroundColor = '#2c67f2'
    let color = 'white'

    switch (event.type) {
      case 'booking':
        backgroundColor = '#10b981' // emerald-500
        color = 'white'
        break
      case 'unavailable':
        backgroundColor = '#ef4444' // red-500
        color = 'white'
        break
      case 'available':
        backgroundColor = '#62cff4' // primary light
        color = 'white'
        break
    }

    return {
      style: {
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '500',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '2px 6px'
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 text-white">
              <CalendarIcon className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-semibold">
                  {mode === 'property' ? `Calendrier - ${entityTitle}` : 'Mon Planning'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {mode === 'property' 
                    ? 'Gérez les disponibilités de votre propriété'
                    : 'Gérez vos créneaux de disponibilité'
                  }
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAvailabilityDialog(true)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              {mode === 'property' ? 'Bloquer des dates' : 'Définir disponibilités'}
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 bg-gradient-to-r from-[#62cff4] to-[#2c67f2] mx-auto mb-4 opacity-80"></div>
                <p className="text-gray-600">Chargement du calendrier...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded-lg shadow-sm"></div>
                    <span className="text-gray-700 font-medium">
                      {mode === 'property' ? 'Réservations confirmées' : 'Interventions programmées'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-lg shadow-sm"></div>
                    <span className="text-gray-700 font-medium">
                      {mode === 'property' ? 'Périodes bloquées' : 'Indisponible'}
                    </span>
                  </div>
                  {mode === 'provider' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-lg shadow-sm"></div>
                      <span className="text-gray-700 font-medium">Disponible</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="h-[600px] p-4">
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
            </div>
          )}
        </div>
      </div>

      {showAvailabilityDialog && (
        <AvailabilityDialog
          isOpen={showAvailabilityDialog}
          onClose={() => {
            setShowAvailabilityDialog(false)
            setSelectedSlot(null)
          }}
          onConfirm={handleSetAvailability}
          initialDates={selectedSlot}
          propertyTitle={entityTitle}
        />
      )}
    </div>
  )
}

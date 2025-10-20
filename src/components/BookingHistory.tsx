import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import { handleAsyncOperation } from '../lib/error-handling'
import { Calendar, MapPin, CreditCard } from 'lucide-react'
import { StorageImage } from '@/components/ui/storage-image'

interface Booking {
  id: string
  check_in: string
  check_out: string
  total_amount: number
  status: string | null
  created_at: string | null
  property: {
    id: string
    title: string
    address: string
    city: string
    images: string[] | null
  }
}

export function BookingHistoryComponent() {
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const loadBookings = useCallback(async () => {
    if (!user) return

    await handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            check_in,
            check_out,
            total_amount,
            status,
            created_at,
            properties!property_id (
              id,
              title,
              address,
              city,
              images
            )
          `)
          .eq('traveler_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        const transformedBookings = (data || []).map(booking => ({
          id: booking.id,
          check_in: booking.check_in,
          check_out: booking.check_out,
          total_amount: booking.total_amount,
          status: booking.status,
          created_at: booking.created_at,
          property: {
            id: booking.properties?.id || '',
            title: booking.properties?.title || 'Propriété supprimée',
            address: booking.properties?.address || '',
            city: booking.properties?.city || '',
            images: booking.properties?.images || null
          }
        }))

        setBookings(transformedBookings)
        return transformedBookings
      },
      {
        errorMessage: 'Impossible de charger vos réservations'
      }
    )
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const getStatusBadge = (status: string | null) => {
    const statusConfig = {
      pending: { variant: 'default' as const, label: 'En attente' },
      confirmed: { variant: 'secondary' as const, label: 'Confirmé' },
      cancelled: { variant: 'destructive' as const, label: 'Annulé' },
      completed: { variant: 'outline' as const, label: 'Terminé' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date inconnue'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24))
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement de vos réservations...</p>
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation</h3>
        <p className="text-gray-500 mb-6">Vous n'avez pas encore effectué de réservation.</p>
        <Button>
          Rechercher des logements
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Mes réservations</h2>
        <Badge variant="outline">{bookings.length} réservation(s)</Badge>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-48 aspect-video md:aspect-square bg-gray-200">
                {booking.property.images && booking.property.images.length > 0 ? (
                  <StorageImage
                    src={booking.property.images[0]}
                    alt={booking.property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">Aucune image</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{booking.property.title}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {booking.property.city}
                      </CardDescription>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium">Dates de séjour</div>
                        <div>{formatDate(booking.check_in)} - {formatDate(booking.check_out)}</div>
                        <div className="text-xs text-gray-500">
                          {calculateNights(booking.check_in, booking.check_out)} nuit(s)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium">Montant total</div>
                        <div className="text-lg font-bold text-green-600">
                          {booking.total_amount.toFixed(2)}€
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Réservé le {formatDate(booking.created_at)}
                    </div>
                    
                    <div className="flex space-x-2">
                      {booking.status === 'pending' && (
                        <Button variant="outline" size="sm">
                          Annuler
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Voir les détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

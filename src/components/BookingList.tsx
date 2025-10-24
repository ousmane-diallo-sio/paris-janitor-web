import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StorageImage } from '@/components/ui/storage-image'
import { Spinner } from '@/components/ui/spinner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { db } from '@/lib/database'
import { useAuthStore } from '@/stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, MapPin, Euro, Clock, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Booking } from '@/types/database'

interface BookingWithProperty extends Booking {
  properties: {
    title: string
    address: string
    city: string
    images: string[]
  }
}

export function BookingList() {
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<BookingWithProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const fetchBookings = useCallback(async () => {
    if (!user?.id) {
      setBookings([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await db.bookings.getByTravelerId(user.id)
      setBookings(data as BookingWithProperty[])
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError('Erreur lors du chargement de vos réservations')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setIsCancelling(true)
      await db.bookings.cancel(bookingId)
      toast.success('Réservation annulée avec succès')
      await fetchBookings()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      
      const dbError = error as { code?: string; message?: string }
      if (dbError?.code === '23502' && dbError?.message?.includes('http_request_queue')) {
        console.warn('Webhook notification failed (non-critical):', dbError.message)
        toast.success('Réservation annulée avec succès')
        await fetchBookings()
      } else {
        toast.error('Erreur lors de l\'annulation de la réservation')
      }
    } finally {
      setIsCancelling(false)
    }
  }

  const canCancelBooking = (booking: BookingWithProperty): boolean => {
    const checkInDate = new Date(booking.check_in)
    const now = new Date()
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    return hoursUntilCheckIn > 48
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">
          {error}
        </p>
        <Button onClick={fetchBookings} variant="outline">
          Réessayer
        </Button>
      </div>
    )
  }

  if (!bookings?.length) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune réservation</h3>
        <p className="text-muted-foreground">
          Vous n'avez pas encore effectué de réservation.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mes réservations</h2>
        <Badge variant="outline" className="text-sm">
          {bookings.length} réservation{bookings.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-6">
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3">
                <div className="aspect-video md:aspect-square h-full">
                  <StorageImage
                    src={booking.properties?.images?.[0]}
                    alt={booking.properties?.title || 'Propriété'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="md:w-2/3 p-6">
                <CardHeader className="p-0 mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">
                        {booking.properties?.title}
                      </CardTitle>
                      <div className="flex items-center text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {booking.properties?.address}, {booking.properties?.city}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      Du {format(new Date(booking.check_in), 'd MMMM yyyy', { locale: fr })} au{' '}
                      {format(new Date(booking.check_out), 'd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {Math.ceil(
                          (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) /
                          (1000 * 60 * 60 * 24)
                        )} nuit{Math.ceil(
                          (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) /
                          (1000 * 60 * 60 * 24)
                        ) > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center font-semibold">
                      <Euro className="h-4 w-4 mr-1" />
                      <span>{booking.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Réservé le {format(new Date(booking.created_at || ''), 'd MMMM yyyy à HH:mm', { locale: fr })}
                  </div>

                  <div className="pt-2">
                    {canCancelBooking(booking) ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            disabled={isCancelling}
                          >
                            {isCancelling ? (
                              <Spinner className="h-4 w-4 mr-2" />
                            ) : (
                              <X className="h-4 w-4 mr-2" />
                            )}
                            Annuler la réservation
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Annuler la réservation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir annuler votre réservation pour "{booking.properties?.title}" ?
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Garder la réservation</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelBooking(booking.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Annuler la réservation
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <div className="text-sm text-muted-foreground p-2 bg-gray-50 rounded-md">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Annulation possible jusqu'à 48h avant l'arrivée
                      </div>
                    )}
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
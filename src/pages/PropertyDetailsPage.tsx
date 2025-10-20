import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { notify, handleAsyncOperation } from '@/lib/error-handling'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '../components/ui/separator'
import { 
  ArrowLeft, 
  Users, 
  Bed, 
  Bath, 
  MapPin, 
  Euro, 
  Star,
  Wifi,
  Car,
  Coffee,
  Tv
} from 'lucide-react'
import { StorageImage } from '@/components/ui/storage-image'
import type { Property } from '@/types/database'

interface BookingData {
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  commissionAmount: number
}

export function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingData, setBookingData] = useState<BookingData>({
    checkIn: '',
    checkOut: '',
    guests: 2,
    totalAmount: 0,
    commissionAmount: 0
  })
  const [isBooking, setIsBooking] = useState(false)

  const loadProperty = useCallback(async () => {
    if (!id) return

    await handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            profiles:owner_id (
              full_name,
              email
            )
          `)
          .eq('id', id)
          .eq('validation_status', 'approved')
          .single()

        if (error) throw error
        setProperty(data)
        return data
      },
      {
        errorMessage: 'Impossible de charger les détails de la propriété'
      }
    )

    setLoading(false)
  }, [id])

  useEffect(() => {
    loadProperty()
  }, [loadProperty])

  const calculateTotal = useCallback((checkIn: string, checkOut: string, guests: number) => {
    if (!property || !checkIn || !checkOut) return { total: 0, nights: 0, commission: 0 }

    const startDate = new Date(checkIn)
    const endDate = new Date(checkOut)
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24))
    
    if (nights <= 0) return { total: 0, nights: 0, commission: 0 }

    const subtotal = nights * property.nightly_rate * guests
    const commission = subtotal * 0.20 // 20% commission
    const total = subtotal + commission

    return { total, nights, commission, subtotal }
  }, [property])

  useEffect(() => {
    const { total, commission } = calculateTotal(bookingData.checkIn, bookingData.checkOut, bookingData.guests)
    setBookingData(prev => ({
      ...prev,
      totalAmount: total,
      commissionAmount: commission
    }))
  }, [bookingData.checkIn, bookingData.checkOut, bookingData.guests, calculateTotal])

  const handleBooking = async () => {
    if (!user || !property) {
      notify.error('Vous devez être connecté pour effectuer une réservation')
      return
    }

    if (!bookingData.checkIn || !bookingData.checkOut) {
      notify.error('Veuillez sélectionner les dates de séjour')
      return
    }

    const { total, nights } = calculateTotal(bookingData.checkIn, bookingData.checkOut, bookingData.guests)
    
    if (nights <= 0) {
      notify.error('Les dates sélectionnées ne sont pas valides')
      return
    }

    setIsBooking(true)

    const { error } = await handleAsyncOperation(
      async () => {
        // Create booking record
        const bookingRecord = {
          property_id: property.id,
          traveler_id: user.id,
          check_in: bookingData.checkIn,
          check_out: bookingData.checkOut,
          total_amount: total,
          commission_amount: bookingData.commissionAmount,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert([bookingRecord])
          .select()
          .single()

        if (bookingError) throw bookingError

        // TODO: Integrate with Stripe for payment processing
        // For now, we'll mark as confirmed
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed',
            payment_status: 'paid'
          })
          .eq('id', booking.id)

        if (updateError) throw updateError

        return booking
      },
      {
        successMessage: 'Réservation confirmée avec succès ! Vous recevrez un email de confirmation.',
        errorMessage: 'Erreur lors de la réservation'
      }
    )

    setIsBooking(false)

    if (!error) {
      // Redirect to traveler dashboard
      setTimeout(() => navigate('/dashboard/traveler'), 2000)
    }
  }

  const getAmenityIcon = (amenity: string) => {
    const iconProps = { className: "h-4 w-4" }
    
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi {...iconProps} />
      case 'parking':
        return <Car {...iconProps} />
      case 'coffee':
        return <Coffee {...iconProps} />
      case 'tv':
        return <Tv {...iconProps} />
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des détails...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Propriété introuvable</h2>
          <p className="text-gray-600 mb-6">Cette propriété n'existe pas ou n'est plus disponible.</p>
          <Link to="/search">
            <Button>Retour à la recherche</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { total, nights, commission, subtotal } = calculateTotal(bookingData.checkIn, bookingData.checkOut, bookingData.guests)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </Button>
            
            {user?.role === 'traveler' && (
              <Link to="/dashboard/traveler">
                <Button variant="outline">Mon Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <div className="flex items-center space-x-2 text-gray-600 mb-4">
                <MapPin className="h-4 w-4" />
                <span>{property.address}, {property.city}</span>
              </div>
              
              <div className="flex items-center space-x-4 mb-6">
                <Badge className="bg-green-100 text-green-800">
                  {property.validation_status === 'approved' ? 'Vérifié' : 'En attente'}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm">4.8 (12 avis)</span>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            {property.images && property.images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="md:col-span-2">
                      <StorageImage
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-96 object-cover rounded-lg"
                      />
                    </div>
                {property.images.slice(1, 5).map((image, index) => (
                  <div key={index} className="relative">
                    <StorageImage
                      src={image}
                      alt={`${property.title} - Image ${index + 2}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {index === 3 && property.images && property.images.length > 5 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <span className="text-white font-medium">
                          +{property.images.length - 5} photos
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {property.description || 'Aucune description disponible.'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Détails de la propriété</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span>{property.capacity} voyageurs maximum</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bed className="h-5 w-5 text-gray-400" />
                    <span>{property.bedrooms || 1} chambre(s)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bath className="h-5 w-5 text-gray-400" />
                    <span>{property.bathrooms || 1} salle(s) de bain</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Euro className="h-5 w-5 text-gray-400" />
                    <span>{property.nightly_rate}€ par nuit</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {property.amenities && property.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Équipements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        {getAmenityIcon(amenity)}
                        <span className="capitalize">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Réserver</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{property.nightly_rate}€</div>
                    <div className="text-sm text-gray-600">par nuit</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkin">Arrivée</Label>
                    <Input
                      id="checkin"
                      type="date"
                      value={bookingData.checkIn}
                      onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkout">Départ</Label>
                    <Input
                      id="checkout"
                      type="date"
                      value={bookingData.checkOut}
                      onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                      min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="guests">Voyageurs</Label>
                  <Input
                    id="guests"
                    type="number"
                    value={bookingData.guests}
                    onChange={(e) => setBookingData(prev => ({ ...prev, guests: Math.max(1, parseInt(e.target.value) || 1) }))}
                    min={1}
                    max={property.capacity}
                  />
                </div>

                {nights > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>{property.nightly_rate}€ × {nights} nuit(s) × {bookingData.guests} voyageur(s)</span>
                      <span>{subtotal?.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Frais de service (20%)</span>
                      <span>{commission.toFixed(2)}€</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{total.toFixed(2)}€</span>
                    </div>
                  </div>
                )}

                {user?.role === 'traveler' ? (
                  <Button 
                    className="w-full" 
                    onClick={handleBooking}
                    disabled={isBooking || !bookingData.checkIn || !bookingData.checkOut || nights <= 0}
                  >
                    {isBooking ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Réservation...</span>
                      </div>
                    ) : (
                      `Réserver ${nights > 0 ? `- ${total.toFixed(2)}€` : ''}`
                    )}
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Connectez-vous en tant que voyageur pour réserver
                    </p>
                    <Link to="/auth">
                      <Button className="w-full">Se connecter</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

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
      <div className="min-h-screen bg-gradient-to-br from-[#62cff4] via-blue-50 to-[#2c67f2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-6 text-white text-lg font-medium">Chargement des détails...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#62cff4] via-blue-50 to-[#2c67f2] flex items-center justify-center">
        <Card className="text-center max-w-md mx-auto rounded-2xl bg-white/90 backdrop-blur-sm border-gray-100 shadow-xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Propriété introuvable</h2>
            <p className="text-gray-600 mb-6">Cette propriété n'existe pas ou n'est plus disponible.</p>
            <Link to="/search">
              <Button className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200">
                Retour à la recherche
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { total, nights, commission, subtotal } = calculateTotal(bookingData.checkIn, bookingData.checkOut, bookingData.guests)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </Button>
            
            {user?.role === 'traveler' && (
              <Link to="/dashboard/traveler">
                <Button variant="outline" className="border-gray-200 hover:bg-gray-50 rounded-xl transition-all duration-200">
                  Mon Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 shadow-lg">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{property.title}</h1>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="text-lg">{property.address}, {property.city}</span>
                </div>
                <Badge className="bg-green-100 text-green-800 px-4 py-2 rounded-full">
                  {property.validation_status === 'approved' ? 'Vérifié' : 'En attente'}
                </Badge>
              </div>

              {property.images && property.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <StorageImage
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-96 object-cover rounded-2xl shadow-lg"
                    />
                  </div>
                  {property.images.slice(1, 5).map((image, index) => (
                    <div key={index} className="relative">
                      <StorageImage
                        src={image}
                        alt={`${property.title} - Image ${index + 2}`}
                        className="w-full h-48 object-cover rounded-xl shadow-md"
                      />
                      {index === 3 && property.images && property.images.length > 5 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                          <span className="text-white font-medium text-lg">
                            +{property.images.length - 5} photos
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Card className="rounded-2xl bg-white/70 backdrop-blur-sm border-gray-100 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Description</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 leading-relaxed text-sm">
                  {property.description || 'Aucune description disponible.'}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-white/70 backdrop-blur-sm border-gray-100 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Détails de la propriété</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2 p-3 bg-blue-50/50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">{property.capacity} voyageurs max</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-blue-50/50 rounded-lg">
                    <Bed className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">{property.bedrooms || 1} chambre(s)</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-blue-50/50 rounded-lg">
                    <Bath className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">{property.bathrooms || 1} salle(s) de bain</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white rounded-lg">
                    <Euro className="h-5 w-5" />
                    <span className="text-sm font-bold">{property.nightly_rate}€ par nuit</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {property.amenities && property.amenities.length > 0 && (
              <Card className="rounded-2xl bg-white/70 backdrop-blur-sm border-gray-100 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-900">Équipements</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid md:grid-cols-3 gap-2">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50/50 rounded-lg hover:bg-blue-50/50 transition-all duration-200">
                        {getAmenityIcon(amenity)}
                        <span className="capitalize text-sm font-medium">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 rounded-2xl bg-white/80 backdrop-blur-sm border-gray-100 shadow-xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl font-semibold">Réserver</span>
                  <div className="text-right">
                    <div className="text-3xl font-bold bg-gradient-to-r from-[#62cff4] to-[#2c67f2] bg-clip-text text-transparent">
                      {property.nightly_rate}€
                    </div>
                    <div className="text-sm text-gray-500">par nuit</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkin" className="text-sm font-medium text-gray-700">Arrivée</Label>
                    <Input
                      id="checkin"
                      type="date"
                      value={bookingData.checkIn}
                      onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkout" className="text-sm font-medium text-gray-700">Départ</Label>
                    <Input
                      id="checkout"
                      type="date"
                      value={bookingData.checkOut}
                      onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                      min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                      className="mt-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="guests" className="text-sm font-medium text-gray-700">Voyageurs</Label>
                  <Input
                    id="guests"
                    type="number"
                    value={bookingData.guests}
                    onChange={(e) => setBookingData(prev => ({ ...prev, guests: Math.max(1, parseInt(e.target.value) || 1) }))}
                    min={1}
                    max={property.capacity}
                    className="mt-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {nights > 0 && (
                  <div className="space-y-3 pt-6 border-t border-gray-200">
                    <div className="flex justify-between text-gray-600">
                      <span>{property.nightly_rate}€ × {nights} nuit(s) × {bookingData.guests} voyageur(s)</span>
                      <span className="font-medium">{subtotal?.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Frais de service (20%)</span>
                      <span className="font-medium">{commission.toFixed(2)}€</span>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] bg-clip-text text-transparent">
                        {total.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                )}

                {user?.role === 'traveler' ? (
                  <Button 
                    className="w-full bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white font-semibold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200" 
                    onClick={handleBooking}
                    disabled={isBooking || !bookingData.checkIn || !bookingData.checkOut || nights <= 0}
                  >
                    {isBooking ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Réservation...</span>
                      </div>
                    ) : (
                      `Réserver ${nights > 0 ? `- ${total.toFixed(2)}€` : ''}`
                    )}
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-blue-50/50 rounded-xl">
                    <p className="text-gray-600 mb-4">
                      Connectez-vous en tant que voyageur pour réserver
                    </p>
                    <Link to="/auth">
                      <Button className="w-full bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-200">
                        Se connecter
                      </Button>
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

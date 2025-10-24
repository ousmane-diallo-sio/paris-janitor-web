import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { notify, handleAsyncOperation } from '@/lib/error-handling'
import { checkPropertyAvailability } from '@/services/calendarService'
import { BookingPayment } from '@/components/payment/BookingPayment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Users, 
  Bed, 
  Bath, 
  MapPin,
  Wifi,
  Car,
  Coffee,
  Tv,
  ChefHat,
  Waves,
  Building2,
  Eye,
  Thermometer,
  Ban,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { StorageImage } from '@/components/ui/storage-image'
import type { Property, Profile } from '@/types/database'

interface BookingData {
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  commissionAmount: number
}

type BookingStep = 'details' | 'payment' | 'confirmation'

export function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [property, setProperty] = useState<Property | null>(null)
  const [ownerProfile, setOwnerProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [bookingData, setBookingData] = useState<BookingData>({
    checkIn: '',
    checkOut: '',
    guests: 2,
    totalAmount: 0,
    commissionAmount: 0
  })
  const [isBooking, setIsBooking] = useState(false)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [availabilityChecked, setAvailabilityChecked] = useState(false)
  const [isAvailable, setIsAvailable] = useState(true)
  const [bookingStep, setBookingStep] = useState<BookingStep>('details')
  const [pendingBooking, setPendingBooking] = useState<{
    id: string
    total_amount: number
    guest_email: string
    guest_name: string
  } | null>(null)

  const loadProperty = useCallback(async () => {
    if (!id) return

    await handleAsyncOperation(
      async () => {
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .eq('validation_status', 'approved')
          .single()

        if (propertyError) throw propertyError
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', propertyData.owner_id)
          .single()

        if (profileError) throw profileError

        setProperty(propertyData)
        setOwnerProfile(profileData)
        return { property: propertyData, profile: profileData }
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
    if (!property || !checkIn || !checkOut) return { total: 0, nights: 0, commission: 0, subtotal: 0 }

    const startDate = new Date(checkIn)
    const endDate = new Date(checkOut)
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24))
    
    if (nights <= 0) return { total: 0, nights: 0, commission: 0, subtotal: 0 }

    const subtotal = nights * property.nightly_rate * guests
    const commission = subtotal * 0.20
    const total = subtotal + commission

    return { total, nights, commission, subtotal }
  }, [property])

  const checkAvailability = useCallback(async () => {
    if (!property || !bookingData.checkIn || !bookingData.checkOut) return

    setIsCheckingAvailability(true)
    try {
      const checkInDate = new Date(bookingData.checkIn)
      const checkOutDate = new Date(bookingData.checkOut)
      const available = await checkPropertyAvailability(property.id, checkInDate, checkOutDate)
      setIsAvailable(available)
      setAvailabilityChecked(true)
    } catch (error) {
      console.error('Error checking availability:', error)
      setIsAvailable(false)
      setAvailabilityChecked(true)
    } finally {
      setIsCheckingAvailability(false)
    }
  }, [property, bookingData.checkIn, bookingData.checkOut])

  useEffect(() => {
    const { total, commission } = calculateTotal(bookingData.checkIn, bookingData.checkOut, bookingData.guests)
    setBookingData(prev => ({
      ...prev,
      totalAmount: total,
      commissionAmount: commission
    }))

    if (property && bookingData.checkIn && bookingData.checkOut) {
      checkAvailability()
    } else {
      setAvailabilityChecked(false)
      setIsAvailable(true)
    }
  }, [bookingData.checkIn, bookingData.checkOut, bookingData.guests, calculateTotal, property, checkAvailability])

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

    const checkInDate = new Date(bookingData.checkIn)
    const checkOutDate = new Date(bookingData.checkOut)

    setIsBooking(true)

    try {
      const isAvailable = await checkPropertyAvailability(property.id, checkInDate, checkOutDate)
      
      if (!isAvailable) {
        notify.error('Ces dates ne sont pas disponibles pour cette propriété')
        setIsBooking(false)
        return
      }

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

      setPendingBooking({
        id: booking.id,
        total_amount: booking.total_amount,
        guest_email: user.email!,
        guest_name: user.full_name || user.email!
      })
      setBookingStep('payment')
      
    } catch (error) {
      console.error('Booking error:', error)
      notify.error('Erreur lors de la création de la réservation')
    } finally {
      setIsBooking(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!pendingBooking) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_intent_id: paymentIntentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingBooking.id)

      if (error) throw error

      setBookingStep('confirmation')
      notify.success('Paiement confirmé ! Votre réservation est validée.')
      
      setTimeout(() => navigate('/dashboard/traveler'), 3000)
      
    } catch (error) {
      console.error('Payment confirmation error:', error)
      notify.error('Erreur lors de la confirmation du paiement')
    }
  }

  const handlePaymentError = async (error: string) => {
    if (!pendingBooking) return

    try {
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingBooking.id)
    } catch (updateError) {
      console.error('Error updating booking status:', updateError)
    }

    setBookingStep('details')
    setPendingBooking(null)
    notify.error(`Paiement échoué: ${error}`)
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
      case 'cuisine équipée':
      case 'cuisine equipee':
      case 'kitchen':
        return <ChefHat {...iconProps} />
      case 'lave-vaisselle':
      case 'lave vaisselle':
      case 'dishwasher':
        return <Waves {...iconProps} />
      case 'balcon':
      case 'balcony':
        return <Building2 {...iconProps} />
      case 'vue panoramique':
      case 'vue':
      case 'panoramic view':
      case 'view':
        return <Eye {...iconProps} />
      case 'chauffage':
      case 'heating':
        return <Thermometer {...iconProps} />
      case 'non-fumeur':
      case 'non fumeur':
      case 'no smoking':
        return <Ban {...iconProps} />
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded" />
    }
  }

  const nextImage = () => {
    if (property?.images && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images!.length)
    }
  }

  const prevImage = () => {
    if (property?.images && property.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images!.length) % property.images!.length)
    }
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c67f2] mx-auto"></div>
          <p className="mt-6 text-gray-700 text-lg font-medium">Chargement des détails...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto rounded-2xl bg-white border-gray-200 shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Propriété introuvable</h2>
          <p className="text-gray-600 mb-6">Cette propriété n'existe pas ou n'est plus disponible.</p>
          <Link to="/search">
            <Button className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200">
              Retour à la recherche
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (bookingStep === 'payment' && pendingBooking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setBookingStep('details')}
              className="mb-4 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Paiement</h1>
            <p className="text-gray-600">Finalisez votre réservation</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Récapitulatif de la réservation</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Propriété:</span>
                <span className="font-medium">{property.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Dates:</span>
                <span className="font-medium">
                  {new Date(bookingData.checkIn).toLocaleDateString()} - {new Date(bookingData.checkOut).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Voyageurs:</span>
                <span className="font-medium">{bookingData.guests}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
                <span>Total:</span>
                <span>{pendingBooking.total_amount.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          <BookingPayment
            booking={{
              id: pendingBooking.id,
              total_amount: pendingBooking.total_amount,
              guest_email: pendingBooking.guest_email,
              guest_name: pendingBooking.guest_name
            }}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </div>
      </div>
    )
  }

  if (bookingStep === 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Réservation confirmée !</h2>
          <p className="text-gray-600 mb-6">
            Votre réservation a été confirmée. Vous allez être redirigé vers votre tableau de bord.
          </p>
          <Button
            onClick={() => navigate('/dashboard/traveler')}
            className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white px-6 py-3 rounded-xl"
          >
            Aller au tableau de bord
          </Button>
        </div>
      </div>
    )
  }

  const { total, nights, commission, subtotal } = calculateTotal(bookingData.checkIn, bookingData.checkOut, bookingData.guests)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-sm text-gray-500">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center hover:text-[#2c67f2] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </button>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{property.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{property.address}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>Jusqu'à {property.capacity} voyageurs</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-[4/3] relative group">
                {property.images && property.images.length > 0 ? (
                  <>
                    <StorageImage
                      src={property.images[currentImageIndex]}
                      alt={`${property.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                    
                    {property.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                          aria-label="Image précédente"
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-700" />
                        </button>
                        
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                          aria-label="Image suivante"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-700" />
                        </button>
                      </>
                    )}
                    
                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
                      {currentImageIndex + 1} / {property.images.length}
                    </div>
                    
                    {property.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {property.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToImage(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                              index === currentImageIndex 
                                ? 'bg-white scale-125' 
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Aller à l'image ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-lg">Aucune image disponible</span>
                  </div>
                )}
              </div>
              
              {property.images && property.images.length > 1 && (
                <div className="p-6 border-t border-gray-200">
                  <div className="flex space-x-3 overflow-x-auto p-2">
                    {property.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          index === currentImageIndex 
                            ? 'border-[#2c67f2] ring-2 ring-[#2c67f2]/40 shadow-lg' 
                            : 'border-gray-200'
                        }`}
                      >
                        <StorageImage
                          src={image}
                          alt={`${property.title} thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Logement entier</h2>
                  <p className="text-gray-600">Hôte : {ownerProfile?.full_name || 'Propriétaire'}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900">{property.nightly_rate}€</span>
                    <span className="text-gray-600 ml-1">/nuit</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{property.bedrooms}</div>
                    <div className="text-sm text-gray-500">chambres</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Bath className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{property.bathrooms}</div>
                    <div className="text-sm text-gray-500">salle de bain</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{property.capacity}</div>
                    <div className="text-sm text-gray-500">voyageurs max</div>
                  </div>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Ce que propose ce logement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-3 text-gray-700">
                        {getAmenityIcon(amenity)}
                        <span className="capitalize">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <div className="mb-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{property.nightly_rate}€</span>
                    <span className="text-gray-600 ml-1">/nuit</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="checkin" className="text-sm font-medium text-gray-700 mb-2 block">Arrivée</Label>
                    <Input
                      id="checkin"
                      type="date"
                      value={bookingData.checkIn}
                      onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="rounded-lg border-gray-300 focus:border-[#2c67f2] focus:ring-[#2c67f2]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkout" className="text-sm font-medium text-gray-700 mb-2 block">Départ</Label>
                    <Input
                      id="checkout"
                      type="date"
                      value={bookingData.checkOut}
                      onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                      min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                      className="rounded-lg border-gray-300 focus:border-[#2c67f2] focus:ring-[#2c67f2]"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="guests" className="text-sm font-medium text-gray-700 mb-2 block">Voyageurs</Label>
                  <Input
                    id="guests"
                    type="number"
                    min="1"
                    max={property.capacity}
                    value={bookingData.guests}
                    onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                    className="rounded-lg border-gray-300 focus:border-[#2c67f2] focus:ring-[#2c67f2]"
                  />
                </div>

                {bookingData.checkIn && bookingData.checkOut && (
                  <div className="space-y-3">
                    {isCheckingAvailability ? (
                      <div className="flex items-center justify-center py-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2c67f2]"></div>
                        <span className="ml-2 text-sm text-gray-600">Vérification de la disponibilité...</span>
                      </div>
                    ) : availabilityChecked && (
                      <div className={`p-3 rounded-lg ${isAvailable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center">
                          {isAvailable ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              <span className="text-sm font-medium text-green-800">Disponible</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                              <span className="text-sm font-medium text-red-800">Non disponible</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {nights > 0 && (
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{property.nightly_rate}€ x {nights} nuits</span>
                      <span className="text-gray-900">{subtotal.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Commission de service</span>
                      <span className="text-gray-900">{commission.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold pt-3 border-t border-gray-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{total.toFixed(2)}€</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBooking}
                  disabled={!user || !bookingData.checkIn || !bookingData.checkOut || !isAvailable || isBooking || isCheckingAvailability}
                  className="w-full bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white rounded-lg py-3 text-base font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isBooking ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Réservation...
                    </div>
                  ) : !user ? (
                    'Connectez-vous pour réserver'
                  ) : !bookingData.checkIn || !bookingData.checkOut ? (
                    'Sélectionnez vos dates'
                  ) : !isAvailable ? (
                    'Dates non disponibles'
                  ) : (
                    'Réserver maintenant'
                  )}
                </Button>

                {!user && (
                  <p className="text-xs text-gray-500 text-center">
                    Vous devez être connecté pour effectuer une réservation
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
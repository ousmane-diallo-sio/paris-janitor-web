import React, { useState, useEffect, useCallback } from 'react'
import { X, CreditCard } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Label } from '../components/ui/label'
import { Spinner } from '../components/ui/spinner'
import { ServicePricingCalculator } from '../services/pricingService'
import { db } from '../lib/database'
import { useAuthStore } from '../stores/auth'
import { toast } from 'sonner'
import { ServicePayment } from './payment/ServicePayment'
import { 
  SERVICE_CATEGORY_CONFIG,
  type ServiceWithProvider,
  type ServiceRequestStatus,
  SERVICE_REQUEST_STATUSES 
} from '../types/services'
import type { Property } from '../types/database'

interface ServiceRequestModalProps {
  service: ServiceWithProvider | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface BookingForm {
  propertyId: string
  requestedDate: string
  requestedTime: string
  duration?: number
  distance?: number
  quantity: number
  notes: string
}

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  service,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuthStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showPayment, setShowPayment] = useState(false)
  const [createdRequest, setCreatedRequest] = useState<{ id: string } | null>(null)
  
  const [form, setForm] = useState<BookingForm>({
    propertyId: '',
    requestedDate: '',
    requestedTime: '09:00',
    duration: undefined,
    distance: undefined,
    quantity: 1,
    notes: ''
  })

  const loadUserProperties = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)

      const bookedProperties = await db.properties.getBookedPropertiesByUser(user.id)
      setProperties(bookedProperties)
      
      if (bookedProperties.length === 1) {
        setForm(prev => ({ ...prev, propertyId: bookedProperties[0].id }))
      }
    } catch (err) {
      console.error('Error loading properties:', err)
      const errorMessage = 'Erreur lors du chargement des propriétés'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isOpen && user) {
      loadUserProperties()
    }
  }, [isOpen, user, loadUserProperties])

  useEffect(() => {
    if (service) {
      setForm(prev => ({
        ...prev,
        duration: service.duration_minutes || undefined,
        quantity: 1
      }))
    }
  }, [service])

  const calculatePricing = () => {
    if (!service) return null
    
    const requestedDateTime = new Date(`${form.requestedDate}T${form.requestedTime}`)
    
    return ServicePricingCalculator.calculatePrice(service, {
      quantity: form.quantity,
      duration: form.duration,
      distance: form.distance,
      isVipTraveler: user?.vip_subscription || false,
      requestedDate: requestedDateTime
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!service || !user) return
    
    setError(null)
    
    try {
      setSubmitting(true)
      
      // Validate form
      if (!form.propertyId || !form.requestedDate || !form.requestedTime) {
        const errorMessage = 'Veuillez remplir tous les champs obligatoires'
        setError(errorMessage)
        toast.error(errorMessage)
        return
      }
      
      const requestedDateTime = new Date(`${form.requestedDate}T${form.requestedTime}`)
      const pricing = calculatePricing()
      
      if (!pricing) {
        const errorMessage = 'Erreur lors du calcul du prix'
        setError(errorMessage)
        toast.error(errorMessage)
        return
      }
      
      // Create service request
      const serviceRequest = {
        service_id: service.id,
        requester_id: user.id,
        property_id: form.propertyId,
        requested_date: requestedDateTime.toISOString(),
        duration_minutes: form.duration || null,
        distance_km: form.distance || null,
        quantity: form.quantity,
        total_amount: pricing.total,
        notes: form.notes || null,
        status: SERVICE_REQUEST_STATUSES.PENDING as ServiceRequestStatus
      }
      
      const newRequest = await db.serviceRequests.create(serviceRequest)
      
      if (newRequest) {
        toast.success(`Demande créée! Procédez maintenant au paiement.`)
        setCreatedRequest(newRequest)
        setShowPayment(true)
        
        // Reset form but keep modal open for payment
        setForm({
          propertyId: '',
          requestedDate: '',
          requestedTime: '09:00',
          duration: service.duration_minutes || undefined,
          distance: undefined,
          quantity: 1,
          notes: ''
        })
        setRetryCount(0)
      }
    } catch (err) {
      console.error('Error creating service request:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la demande'
      setError(errorMessage)
      setRetryCount(prev => prev + 1)
      toast.error(`Erreur: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentSuccess = async () => {
    if (!createdRequest) return

    try {
      // Update the service request with payment confirmation
      await db.serviceRequests.update(createdRequest.id, {
        status: SERVICE_REQUEST_STATUSES.PAID as ServiceRequestStatus
      })

      toast.success(`Paiement réussi pour ${service?.name}! Le prestataire va examiner votre demande.`)
      onSuccess?.()
      onClose()
      
      // Reset states
      setShowPayment(false)
      setCreatedRequest(null)
    } catch (err) {
      console.error('Error updating payment status:', err)
      toast.error('Erreur lors de la confirmation du paiement')
    }
  }

  const handlePaymentError = (error: string) => {
    toast.error(`Erreur de paiement: ${error}`)
    setShowPayment(false)
  }

  const getCategoryConfig = (category: string) => {
    // Find matching category key and return config
    const categoryKey = Object.keys(SERVICE_CATEGORY_CONFIG).find(
      key => key.toLowerCase() === category.toLowerCase()
    )
    return categoryKey ? SERVICE_CATEGORY_CONFIG[categoryKey as keyof typeof SERVICE_CATEGORY_CONFIG] : null
  }

  if (!isOpen || !service) return null

  const pricing = calculatePricing()
  const categoryConfig = getCategoryConfig(service.category)

  // Show payment modal if payment flow is active
  if (showPayment && createdRequest && pricing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <ServicePayment
            serviceRequest={{
              id: createdRequest.id,
              total_amount: pricing.total,
              service_name: service.name,
              requester_name: user?.full_name || 'Client'
            }}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onClose={() => {
              setShowPayment(false)
              setCreatedRequest(null)
              onClose()
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{categoryConfig?.icon || '🔧'}</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Réserver: {service.name}
              </h2>
              <p className="text-sm text-gray-600">
                Avec {service.provider.full_name}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erreur de réservation</h3>
                  <div className="mt-1 text-sm text-red-700">
                    {error}
                    {retryCount > 0 && (
                      <span className="block mt-1 text-xs">
                        Tentative {retryCount} sur 3
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-sm text-red-600 hover:text-red-500 underline"
                    >
                      Réessayer
                    </button>
                    {retryCount >= 3 && (
                      <span className="ml-3 text-xs text-red-500">
                        Nombre maximum de tentatives atteint. Veuillez contacter le support si le problème persiste.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="property">Propriété *</Label>
            {loading ? (
              <div className="text-gray-500">Chargement des propriétés...</div>
            ) : properties.length === 0 ? (
              <div className="text-red-600">
                Aucune propriété trouvée. Vous devez d'abord ajouter une propriété.
              </div>
            ) : (
              <Select
                value={form.propertyId}
                onValueChange={(value) => {
                  setForm(prev => ({ ...prev, propertyId: value }))
                  if (error) setError(null)
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une propriété" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title} - {property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                type="date"
                id="date"
                value={form.requestedDate}
                onChange={(e) => {
                  setForm(prev => ({ ...prev, requestedDate: e.target.value }))
                  if (error) setError(null)
                }}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Heure *</Label>
              <Input
                type="time"
                id="time"
                value={form.requestedTime}
                onChange={(e) => {
                  setForm(prev => ({ ...prev, requestedTime: e.target.value }))
                  if (error) setError(null)
                }}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                type="number"
                id="quantity"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>

            {service.price_type === 'hourly' && (
              <div className="space-y-2">
                <Label htmlFor="duration">Durée (minutes)</Label>
                <Input
                  type="number"
                  id="duration"
                  min="15"
                  step="15"
                  value={form.duration || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, duration: parseInt(e.target.value) || undefined }))}
                />
              </div>
            )}

            {service.price_type === 'distance' && (
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  type="number"
                  id="distance"
                  min="0"
                  step="0.1"
                  value={form.distance || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, distance: parseFloat(e.target.value) || undefined }))}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <textarea
              id="notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Instructions particulières, accès, etc..."
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {pricing && (
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold mb-3">Récapitulatif des prix</h3>
              <div className="space-y-2 text-sm">
                {pricing.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.label}</span>
                    <span>{ServicePricingCalculator.formatPrice(item.amount)}</span>
                  </div>
                ))}
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span>Commission (20%)</span>
                  <span>{ServicePricingCalculator.formatPrice(pricing.commission)}</span>
                </div>
                {pricing.vipDiscount && (
                  <div className="flex justify-between text-green-600">
                    <span>Remise VIP (10%)</span>
                    <span>-{ServicePricingCalculator.formatPrice(pricing.vipDiscount)}</span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-indigo-600">
                    {ServicePricingCalculator.formatPrice(pricing.total)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting || properties.length === 0}
              className="flex-1 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Création en cours...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Procéder au paiement
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServiceRequestModal
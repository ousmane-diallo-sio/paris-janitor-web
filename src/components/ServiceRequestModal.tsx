import React, { useState, useEffect, useCallback } from 'react'
import { X, CreditCard } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Select } from '../components/ui/select'
import { Label } from '../components/ui/label'
import { ServicePricingCalculator } from '../services/pricingService'
import { db } from '../lib/database'
import { useAuthStore } from '../stores/auth'
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
      const userProperties = await db.properties.getByOwnerId(user.id)
      setProperties(userProperties)
      
      // Auto-select first property if only one
      if (userProperties.length === 1) {
        setForm(prev => ({ ...prev, propertyId: userProperties[0].id }))
      }
    } catch (err) {
      console.error('Error loading properties:', err)
      setError('Erreur lors du chargement des propriétés')
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
    
    try {
      setSubmitting(true)
      setError(null)
      
      // Validate form
      if (!form.propertyId || !form.requestedDate || !form.requestedTime) {
        setError('Veuillez remplir tous les champs obligatoires')
        return
      }
      
      const requestedDateTime = new Date(`${form.requestedDate}T${form.requestedTime}`)
      const pricing = calculatePricing()
      
      if (!pricing) {
        setError('Erreur lors du calcul du prix')
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
        onSuccess?.()
        onClose()
        
        // Reset form
        setForm({
          propertyId: '',
          requestedDate: '',
          requestedTime: '09:00',
          duration: service.duration_minutes || undefined,
          distance: undefined,
          quantity: 1,
          notes: ''
        })
      }
    } catch (err) {
      console.error('Error creating service request:', err)
      setError('Erreur lors de la création de la demande')
    } finally {
      setSubmitting(false)
    }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Property Selection */}
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
                onValueChange={(value) => setForm(prev => ({ ...prev, propertyId: value }))}
                required
              >
                <option value="">Sélectionner une propriété</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.title} - {property.address}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                type="date"
                id="date"
                value={form.requestedDate}
                onChange={(e) => setForm(prev => ({ ...prev, requestedDate: e.target.value }))}
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
                onChange={(e) => setForm(prev => ({ ...prev, requestedTime: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Service-specific fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
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

            {/* Duration (if not fixed) */}
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

            {/* Distance (for distance-based pricing) */}
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

          {/* Notes */}
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

          {/* Pricing Summary */}
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

          {/* Actions */}
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
              <CreditCard className="w-4 h-4" />
              {submitting ? 'Création...' : 'Confirmer la réservation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServiceRequestModal
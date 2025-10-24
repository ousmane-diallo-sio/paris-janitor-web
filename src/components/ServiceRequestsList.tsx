import React, { useState, useEffect, useCallback } from 'react'
import { Clock, MapPin, User, Euro, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ServicePayment } from './payment/ServicePayment'
import { 
  SERVICE_CATEGORY_CONFIG,
  SERVICE_REQUEST_STATUSES,
  type ServiceRequestStatus 
} from '@/types/services'
import { formatEuros } from '@/lib/utils'

interface ServiceRequestWithDetails {
  id: string
  service_id: string
  requester_id: string
  property_id: string
  requested_date: string
  duration_minutes: number | null
  distance_km: number | null
  quantity: number
  total_amount: number
  notes: string | null
  status: ServiceRequestStatus
  created_at: string
  services: {
    id: string
    name: string
    category: string
    description: string | null
    profiles: {
      full_name: string | null
    }
  }
  properties: {
    id: string
    title: string
    address: string
  }
}

interface ServiceRequestsListProps {
  onRequestUpdate?: () => void
}

export const ServiceRequestsList: React.FC<ServiceRequestsListProps> = ({
  onRequestUpdate
}) => {
  const { user } = useAuthStore()
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentRequest, setPaymentRequest] = useState<ServiceRequestWithDetails | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  const loadServiceRequests = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('service_requests')
        .select(`
          *,
          services (
            id,
            name,
            category,
            description,
            profiles:provider_id (
              full_name
            )
          ),
          properties (
            id,
            title,
            address
          )
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setServiceRequests((data || []) as ServiceRequestWithDetails[])
    } catch (err) {
      console.error('Error loading service requests:', err)
      const errorMessage = 'Erreur lors du chargement des demandes de service'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadServiceRequests()
  }, [loadServiceRequests])

  const getStatusConfig = (status: ServiceRequestStatus) => {
    switch (status) {
      case SERVICE_REQUEST_STATUSES.PENDING:
        return {
          label: 'En attente',
          color: 'bg-yellow-100 text-yellow-800',
          icon: <AlertCircle className="w-4 h-4" />
        }
      case SERVICE_REQUEST_STATUSES.PAID:
        return {
          label: 'Payé - En attente',
          color: 'bg-blue-100 text-blue-800',
          icon: <CheckCircle className="w-4 h-4" />
        }
      case SERVICE_REQUEST_STATUSES.ACCEPTED:
        return {
          label: 'Acceptée',
          color: 'bg-blue-100 text-blue-800',
          icon: <CheckCircle className="w-4 h-4" />
        }
      case SERVICE_REQUEST_STATUSES.COMPLETED:
        return {
          label: 'Terminée',
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="w-4 h-4" />
        }
      case SERVICE_REQUEST_STATUSES.CANCELLED:
        return {
          label: 'Annulée',
          color: 'bg-red-100 text-red-800',
          icon: <XCircle className="w-4 h-4" />
        }
      case SERVICE_REQUEST_STATUSES.REJECTED:
        return {
          label: 'Refusée',
          color: 'bg-red-100 text-red-800',
          icon: <XCircle className="w-4 h-4" />
        }
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800',
          icon: <AlertCircle className="w-4 h-4" />
        }
    }
  }

  const getCategoryConfig = (category: string) => {
    const categoryKey = Object.keys(SERVICE_CATEGORY_CONFIG).find(
      key => key.toLowerCase() === category.toLowerCase()
    )
    return categoryKey ? SERVICE_CATEGORY_CONFIG[categoryKey as keyof typeof SERVICE_CATEGORY_CONFIG] : null
  }

  const handlePayment = (request: ServiceRequestWithDetails) => {
    setPaymentRequest(request)
    setShowPayment(true)
  }

  const handlePaymentSuccess = async () => {
    if (!paymentRequest) return

    try {
      // Update request status to paid after payment
      const { error } = await supabase
        .from('service_requests')
        .update({ 
          status: SERVICE_REQUEST_STATUSES.PAID
        })
        .eq('id', paymentRequest.id)

      if (error) throw error

      toast.success('Paiement effectué avec succès!')
      setShowPayment(false)
      setPaymentRequest(null)
      loadServiceRequests()
      onRequestUpdate?.()
    } catch (err) {
      console.error('Error updating payment status:', err)
      toast.error('Erreur lors de la mise à jour du paiement')
    }
  }

  const handlePaymentError = (error: string) => {
    toast.error(`Erreur de paiement: ${error}`)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <XCircle className="w-12 h-12 mx-auto mb-2" />
            {error}
          </div>
          <Button onClick={loadServiceRequests}>Réessayer</Button>
        </CardContent>
      </Card>
    )
  }

  if (serviceRequests.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🛎️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune demande de service
          </h3>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas encore réservé de services supplémentaires
          </p>
          <Button className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white">
            Découvrir nos services
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {serviceRequests.map((request) => {
          const statusConfig = getStatusConfig(request.status)
          const categoryConfig = getCategoryConfig(request.services.category)
          const needsPayment = request.status === SERVICE_REQUEST_STATUSES.PENDING

          return (
            <Card key={request.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{categoryConfig?.icon || '🔧'}</div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">
                        {request.services.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <User className="w-4 h-4" />
                        <span>{request.services.profiles?.full_name || 'Prestataire'}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${statusConfig.color} flex items-center gap-1`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{request.properties.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(request.requested_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {request.duration_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{request.duration_minutes} min</span>
                    </div>
                  )}
                </div>

                {request.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <strong>Notes:</strong> {request.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-lg font-semibold text-gray-900">
                    <Euro className="w-5 h-5" />
                    <span>{formatEuros(request.total_amount)}</span>
                  </div>

                  {needsPayment && (
                    <Button
                      onClick={() => handlePayment(request)}
                      className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white hover:opacity-90"
                    >
                      Payer maintenant
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {showPayment && paymentRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <ServicePayment
              serviceRequest={{
                id: paymentRequest.id,
                total_amount: paymentRequest.total_amount,
                service_name: paymentRequest.services.name,
                requester_name: user?.full_name || 'Client'
              }}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onClose={() => {
                setShowPayment(false)
                setPaymentRequest(null)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default ServiceRequestsList
import { Navigate, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '../lib/supabase'
import { handleAsyncOperation } from '../lib/error-handling'
import { Calendar, Clock, Star, Euro, MapPin, CheckCircle, AlertCircle, Users, Wrench, Settings } from 'lucide-react'
import ServiceManagement from '../components/common/ServiceManagement'
import { UserCalendar } from '../components/calendar/UserCalendar'
import { InterventionList } from '@/components/interventions'

interface ServiceRequest {
  id: string
  requested_date: string
  status: string | null
  total_amount: number
  notes: string | null
  quantity: number | null
  created_at: string | null
  service: {
    name: string
    category: string
    description: string | null
  }
  property?: {
    title: string
    address: string
    city: string
  }
  requester: {
    full_name: string | null
    email: string | null
  }
}

interface PerformanceStats {
  totalInterventions: number
  averageRating: number
  completedThisMonth: number
  monthlyEarnings: number
  pendingRequests: number
}

export function ServiceProviderDashboard() {
  const { user, signOut, loading } = useAuthStore()
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [stats, setStats] = useState<PerformanceStats>({
    totalInterventions: 0,
    averageRating: 0,
    completedThisMonth: 0,
    monthlyEarnings: 0,
    pendingRequests: 0
  })
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'planning' | 'interventions'>('dashboard')

  const loadServiceRequests = useCallback(async () => {
    if (!user) return

    await handleAsyncOperation(
      async () => {
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('id')
          .eq('provider_id', user.id)

        if (servicesError) throw servicesError

        if (!services || services.length === 0) {
          setServiceRequests([])
          return []
        }

        const serviceIds = services.map(s => s.id)

        const { data, error } = await supabase
          .from('service_requests')
          .select(`
            id,
            requested_date,
            status,
            total_amount,
            notes,
            quantity,
            created_at,
            services!service_id (
              name,
              category,
              description
            ),
            properties!property_id (
              title,
              address,
              city
            ),
            profiles!requester_id (
              full_name,
              email
            )
          `)
          .in('service_id', serviceIds)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error

        const transformedRequests = (data || []).map(request => ({
          id: request.id,
          requested_date: request.requested_date,
          status: request.status,
          total_amount: request.total_amount,
          notes: request.notes,
          quantity: request.quantity,
          created_at: request.created_at,
          service: {
            name: request.services?.name || 'Service inconnu',
            category: request.services?.category || '',
            description: request.services?.description || null
          },
          property: request.properties ? {
            title: request.properties.title || 'Propriété inconnue',
            address: request.properties.address || '',
            city: request.properties.city || ''
          } : undefined,
          requester: {
            full_name: request.profiles?.full_name || null,
            email: request.profiles?.email || null
          }
        }))

        setServiceRequests(transformedRequests)
        return transformedRequests
      },
      {
        errorMessage: 'Impossible de charger vos demandes de service'
      }
    )
    setRequestsLoading(false)
  }, [user])

  const loadPerformanceStats = useCallback(async () => {
    if (!user) return

    await handleAsyncOperation(
      async () => {
        const pendingCount = serviceRequests.filter(r => r.status === 'pending' || r.status === 'paid').length
        const completedThisMonth = serviceRequests.filter(r =>
          r.status === 'completed' &&
          r.created_at &&
          new Date(r.created_at).getMonth() === new Date().getMonth()
        ).length

        setStats({
          totalInterventions: serviceRequests.length,
          averageRating: 0,
          completedThisMonth,
          monthlyEarnings: completedThisMonth * 85, // TODO: implement proper monthly earnings calculation
          pendingRequests: pendingCount
        })
      },
      {
        errorMessage: 'Impossible de charger vos statistiques'
      }
    )
  }, [user, serviceRequests])

  useEffect(() => {
    loadServiceRequests()
  }, [loadServiceRequests])

  useEffect(() => {
    if (serviceRequests.length > 0) {
      loadPerformanceStats()
    }
  }, [loadPerformanceStats, serviceRequests])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'default' as const, label: 'En attente de paiement', icon: Clock },
      paid: { variant: 'secondary' as const, label: 'Payé - Répondre', icon: CheckCircle },
      accepted: { variant: 'secondary' as const, label: 'Accepté', icon: CheckCircle },
      in_progress: { variant: 'default' as const, label: 'En cours', icon: Wrench },
      completed: { variant: 'outline' as const, label: 'Terminé', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, label: 'Annulé', icon: AlertCircle },
      rejected: { variant: 'destructive' as const, label: 'Refusé', icon: AlertCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    await handleAsyncOperation(
      async () => {
        const { error } = await supabase
          .from('service_requests')
          .update({ status: newStatus })
          .eq('id', requestId)

        if (error) throw error

        setServiceRequests(prev =>
          prev.map(req =>
            req.id === requestId ? { ...req, status: newStatus } : req
          )
        )
      },
      {
        successMessage: 'Statut mis à jour avec succès !',
        errorMessage: 'Erreur lors de la mise à jour du statut'
      }
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!loading && !user) {
    return <Navigate to="/auth" replace />
  }

  if (!loading && user && user.role !== 'service_provider') {
    return <Navigate to={`/dashboard/${user.role?.replace('_', '-')}`} replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative">
          <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  Dashboard Prestataire
                </h1>
                <p className="text-white/90">
                  Bonjour, {user?.full_name?.split(' ')[0] || user?.email}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Link to="/profile">
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg">
                    Mon profil
                  </Button>
                </Link>
                <Button variant="outline" onClick={signOut} className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg">
                  Se déconnecter
                </Button>
              </div>
            </div>
          </header>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${activeTab === 'services'
                  ? 'bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Settings className="w-4 h-4 mr-2 inline" />
              Mes Services
            </button>
            <button
              onClick={() => setActiveTab('planning')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${activeTab === 'planning'
                  ? 'bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Calendar className="w-4 h-4 mr-2 inline" />
              Planning
            </button>
            <button
              onClick={() => setActiveTab('interventions')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${activeTab === 'interventions'
                  ? 'bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Wrench className="w-4 h-4 mr-2 inline" />
              Interventions
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Revenus du mois</CardTitle>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Euro className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.monthlyEarnings.toFixed(0)} €</div>
                  <p className="text-xs text-gray-500">
                    Basé sur {stats.completedThisMonth} interventions
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Interventions totales</CardTitle>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Wrench className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalInterventions}</div>
                  <p className="text-xs text-gray-500">
                    {stats.pendingRequests} en attente
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Note moyenne</CardTitle>
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}/5</div>
                  <p className="text-xs text-gray-500">
                    Évaluation clients
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Ce mois</CardTitle>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.completedThisMonth}</div>
                  <p className="text-xs text-gray-500">
                    Services terminés
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Mes services</CardTitle>
                  <CardDescription className="text-gray-600">
                    Gérez vos offres de services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#4fb8e8] hover:to-[#1e4fd4] text-white font-medium py-2.5 rounded-lg"
                    onClick={() => setActiveTab('services')}
                  >
                    Ajouter un service
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-lg border-gray-300 hover:bg-gray-50 py-2.5"
                    onClick={() => setActiveTab('services')}
                  >
                    Voir mes services
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Disponibilités</CardTitle>
                  <CardDescription className="text-gray-600">
                    Gérez votre planning
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2.5 rounded-lg"
                    onClick={() => setActiveTab('planning')}
                  >
                    Voir le planning
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border border-gray-200 rounded-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">Demandes de service</CardTitle>
                    <CardDescription className="text-gray-600">
                      Gérez vos demandes d'intervention
                    </CardDescription>
                  </div>
                  {stats.pendingRequests > 0 && (
                    <div className="flex gap-2">
                      <Badge className="bg-red-100 text-red-700 border-red-200 px-3 py-1">
                        {stats.pendingRequests} nouvelles
                      </Badge>
                      {serviceRequests.filter(r => r.status === 'paid').length > 0 && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                          💰 {serviceRequests.filter(r => r.status === 'paid').length} payées
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement des demandes...</p>
                  </div>
                ) : serviceRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
                    <p className="text-gray-600">Vous n'avez pas encore reçu de demandes de service.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {serviceRequests.slice(0, 3).map((request) => (
                      <Card key={request.id} className="bg-gray-50 border-gray-200 hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900">{request.service.name}</h4>
                                  {request.status === 'paid' && (
                                    <Badge className="bg-green-100 text-green-700 text-xs px-2 py-1">
                                      💰 Payé
                                    </Badge>
                                  )}
                                </div>
                                {getStatusBadge(request.status || 'pending')}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                Demandé par: {request.requester.full_name || 'Client anonyme'}
                              </p>
                              {request.property && (
                                <p className="text-sm text-gray-500 flex items-center mb-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {request.property.city}
                                </p>
                              )}
                              <p className="text-sm text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(request.requested_date)}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold text-xl text-green-600 mb-2">
                                {request.total_amount.toFixed(2)} €
                              </p>
                              {(request.status === 'pending' || request.status === 'paid') && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1 text-xs"
                                    onClick={() => updateRequestStatus(request.id, 'accepted')}
                                  >
                                    Accepter
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-lg border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 text-xs"
                                    onClick={() => updateRequestStatus(request.id, 'rejected')}
                                  >
                                    Refuser
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {serviceRequests.length > 3 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" className="rounded-lg border-gray-300 hover:bg-gray-50 px-4 py-2">
                          Voir toutes les demandes ({serviceRequests.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6">
              <ServiceManagement />
            </div>
          </div>
        )}

        {activeTab === 'planning' && (
          <UserCalendar
            providerId={user?.id}
            mode="provider"
            onRefresh={() => {
              // Refresh callback if needed for service provider specific data
              console.log('Calendar refreshed for service provider')
            }}
          />
        )}

        {activeTab === 'interventions' && (
          <InterventionList 
            userRole="service_provider" 
            userId={user!.id}
          />
        )}
      </main>
    </div>
  )
}

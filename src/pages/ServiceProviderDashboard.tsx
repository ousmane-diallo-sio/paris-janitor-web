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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services'>('dashboard')

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
        const pendingCount = serviceRequests.filter(r => r.status === 'pending').length
        const completedThisMonth = serviceRequests.filter(r => 
          r.status === 'completed' && 
          r.created_at &&
          new Date(r.created_at).getMonth() === new Date().getMonth()
        ).length

        setStats({
          totalInterventions: serviceRequests.length,
          averageRating: 4.2, // Mock data for now
          completedThisMonth,
          monthlyEarnings: completedThisMonth * 85, // TODO : monthly earnings calculation
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
      pending: { variant: 'default' as const, label: 'En attente', icon: Clock },
      accepted: { variant: 'secondary' as const, label: 'Accepté', icon: CheckCircle },
      in_progress: { variant: 'default' as const, label: 'En cours', icon: Wrench },
      completed: { variant: 'outline' as const, label: 'Terminé', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, label: 'Annulé', icon: AlertCircle }
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Prestataire</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Bonjour, {user?.full_name || user?.email}
              </span>
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  Mon profil
                </Button>
              </Link>
              <Button variant="outline" onClick={signOut}>
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 mr-2 inline" />
              Mes Services
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <>
            {/* Performance Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus du mois</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyEarnings.toFixed(0)} €</div>
              <p className="text-xs text-muted-foreground">
                Basé sur {stats.completedThisMonth} interventions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interventions totales</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInterventions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingRequests} en attente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</div>
              <p className="text-xs text-muted-foreground">
                Évaluation clients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Services terminés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Mes services</CardTitle>
              <CardDescription>
                Gérez vos offres de services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={() => setActiveTab('services')}
                >
                  Ajouter un service
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab('services')}
                >
                  Voir mes services
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disponibilités</CardTitle>
              <CardDescription>
                Gérez votre planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">
                  Modifier mes créneaux
                </Button>
                <Button variant="outline" className="w-full">
                  Voir le planning
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Requests */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Demandes de service
                {stats.pendingRequests > 0 && (
                  <Badge variant="destructive">{stats.pendingRequests} nouvelles</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Gérez vos demandes d'intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Chargement des demandes...</p>
                </div>
              ) : serviceRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
                  <p>Vous n'avez pas encore reçu de demandes de service.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{request.service.name}</h4>
                          {getStatusBadge(request.status || 'pending')}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Demandé par: {request.requester.full_name || 'Client anonyme'}
                        </p>
                        {request.property && (
                          <p className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {request.property.city}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatDate(request.requested_date)}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-lg text-green-600">
                          {request.total_amount.toFixed(2)} €
                        </p>
                        {request.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={() => updateRequestStatus(request.id, 'accepted')}
                            >
                              Accepter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRequestStatus(request.id, 'cancelled')}
                            >
                              Refuser
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {serviceRequests.length > 3 && (
                    <div className="text-center pt-4">
                      <Button variant="outline">
                        Voir toutes les demandes ({serviceRequests.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
          </>
        )}

        {activeTab === 'services' && (
          <ServiceManagement />
        )}
      </main>
    </div>
  )
}

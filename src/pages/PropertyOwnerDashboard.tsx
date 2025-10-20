import { useState, useEffect, useCallback } from 'react'
import { Navigate, Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { PropertyList } from '@/components/properties/PropertyList'
import { UserCalendar } from '@/components/calendar/UserCalendar'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { calculateOwnerMetrics, formatRevenue, formatOccupationRate, type OwnerMetrics } from '@/services/metricsService'
import type { Property } from '@/types/database'
import { getSignedUrl } from '../services/imageService'
import { Building, CheckCircle, Euro, TrendingUp } from 'lucide-react'

type ViewMode = 'list' | 'add' | 'edit' | 'calendar' | 'financial' | 'quotes'

export function PropertyOwnerDashboard() {
  const { user, signOut, loading } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const view = searchParams.get('view') as ViewMode || 'list'
  const propertyId = searchParams.get('propertyId')

  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(false)
  const [error, setError] = useState('')
  const [metrics, setMetrics] = useState<OwnerMetrics>({
    totalProperties: 0,
    approvedProperties: 0,
    monthlyRevenue: 0,
    occupationRate: 0
  })
  const [metricsLoading, setMetricsLoading] = useState(false)

  useEffect(() => {
    if (propertyId && properties.length > 0) {
      const property = properties.find(p => p.id === propertyId)
      setEditingProperty(property || null)
    } else {
      setEditingProperty(null)
    }
  }, [propertyId, properties])

  useEffect(() => {
    const handlePopState = () => {
      // The URL will automatically update, and our component will re-render
      // with the correct view based on searchParams
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const loadProperties = useCallback(async () => {
    if (!user?.id) return

    try {
      setPropertiesLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      await Promise.all(data.map(async (property) => {
        if (property.images && property.images.length > 0) {
          const signedImageUrls = await Promise.all(
            property.images.map(async (imgPath) => {
              return await getSignedUrl(imgPath)
            })
          )
          property.images = signedImageUrls
        }
      }))

      setProperties(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des propriétés'
      setError(errorMessage)
      console.error('Error loading properties:', err)
    } finally {
      setPropertiesLoading(false)
    }
  }, [user?.id])

  const loadMetrics = useCallback(async () => {
    if (!user?.id) return

    try {
      setMetricsLoading(true)
      const metricsData = await calculateOwnerMetrics(user.id)
      setMetrics(metricsData)
    } catch (err) {
      console.error('Error loading metrics:', err)
    } finally {
      setMetricsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadProperties()
    loadMetrics()
  }, [loadProperties, loadMetrics])

  const handleRefresh = useCallback(() => {
    loadProperties()
    loadMetrics()
  }, [loadProperties, loadMetrics])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 flex items-center justify-center">
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

  if (!loading && user && user.role !== 'property_owner') {
    return <Navigate to={`/dashboard/${user.role?.replace('_', '-')}`} replace />
  }

  const handleAddProperty = () => {
    setSearchParams({ view: 'add' })
  }

  const handleEditProperty = (property: Property) => {
    setSearchParams({ view: 'edit', propertyId: property.id })
  }

  const handleManageCalendar = (property: Property) => {
    setSearchParams({ view: 'calendar', propertyId: property.id })
  }

  const handleFormSuccess = () => {
    setSearchParams({})
    loadProperties()
    loadMetrics()
  }

  const handleFormCancel = () => {
    window.history.back()
  }

  const handleBackToList = () => {
    window.history.back()
  }

  const handleManageFinances = () => {
    setSearchParams({ view: 'financial' })
  }

  const handleGenerateQuotes = () => {
    setSearchParams({ view: 'quotes' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="relative bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative">
          <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Tableau de bord Propriétaire
                </h1>
                <p className="text-white/90 text-lg">
                  Bienvenue {user?.full_name?.split(' ')[0] || 'propriétaire'} !
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Link to="/profile">
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Profil
                  </Button>
                </Link>
                <Button variant="outline" onClick={signOut} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Se déconnecter
                </Button>
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {view === 'list' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Mes propriétés
                </h2>
                <p className="text-lg text-gray-600 mt-2">
                  Gérez vos propriétés et suivez leurs performances
                </p>
              </div>
              <div className="flex space-x-4">
                <Button
                  onClick={handleManageFinances}
                  variant="outline"
                  className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-6 py-3"
                >
                  Gestion financière
                </Button>
                <Button
                  onClick={handleGenerateQuotes}
                  variant="outline"
                  className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-6 py-3"
                >
                  Générer un devis
                </Button>
                <Button
                  onClick={handleAddProperty}
                  className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#4fb8e8] hover:to-[#1e4fd4] text-white rounded-lg px-6 py-3 font-medium"
                >
                  Ajouter une propriété
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Propriétés totales</CardTitle>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {metricsLoading ? '...' : metrics.totalProperties}
                  </div>
                  <p className="text-xs text-gray-500">
                    {metricsLoading ? 'Chargement...' : 'Total de vos biens'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Propriétés approuvées</CardTitle>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {metricsLoading ? '...' : metrics.approvedProperties}
                  </div>
                  <p className="text-xs text-gray-500">
                    {metricsLoading ? 'Chargement...' : 'Validées par PJ'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Revenus ce mois</CardTitle>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Euro className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {metricsLoading ? '...' : formatRevenue(metrics.monthlyRevenue)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {metricsLoading ? 'Chargement...' : 'Commissions perçues'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Taux d'occupation</CardTitle>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {metricsLoading ? '...' : formatOccupationRate(metrics.occupationRate)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {metricsLoading ? 'Chargement...' : 'Ce mois-ci'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl bg-white/70 backdrop-blur-sm border-gray-100 shadow-lg">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="text-2xl font-semibold text-gray-900">Liste des propriétés</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {propertiesLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Chargement des propriétés...</p>
                    </div>
                  </div>
                ) : error ? (
                  <Card className="rounded-2xl border-red-200 bg-red-50">
                    <CardContent className="p-6 text-center">
                      <p className="text-red-700 mb-4">{error}</p>
                      <Button
                        onClick={loadProperties}
                        variant="outline"
                        className="rounded-xl border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Réessayer
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <PropertyList
                    properties={properties}
                    onEdit={handleEditProperty}
                    onManageCalendar={handleManageCalendar}
                    onRefresh={handleRefresh}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {(view === 'add' || view === 'edit') && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleFormCancel}
              >
                ← Retour à la liste
              </Button>
              <h2 className="text-xl font-semibold text-gray-900">
                {view === 'add' ? 'Ajouter une propriété' : 'Modifier la propriété'}
              </h2>
            </div>

            <Card>
              <CardContent className="p-6">
                <PropertyForm
                  property={editingProperty}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'calendar' && editingProperty && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleBackToList}
              >
                ← Retour à la liste
              </Button>
              <h2 className="text-xl font-semibold text-gray-900">
                Gestion du calendrier
              </h2>
            </div>

            <UserCalendar
              property={editingProperty}
              mode="property"
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {view === 'financial' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleBackToList}
              >
                ← Retour à la liste
              </Button>
              <h2 className="text-xl font-semibold text-gray-900">
                Gestion financière
              </h2>
            </div>

            {/* <FinancialDashboard ownerId={user!.id} /> */}
          </div>
        )}

        {view === 'quotes' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleBackToList}
              >
                ← Retour à la liste
              </Button>
              <h2 className="text-xl font-semibold text-gray-900">
                Génération de devis
              </h2>
            </div>

            {/* <ServiceQuoteGenerator 
              ownerId={user!.id}
              onQuoteGenerated={(quote) => {
                console.log('Quote generated:', quote)
              }}
            /> */}
          </div>
        )}
      </main>
    </div>
  )
}

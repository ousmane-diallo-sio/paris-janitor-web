import { useState, useEffect, useCallback } from 'react'
import { Navigate, Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { PropertyList } from '@/components/properties/PropertyList'
import { PropertyCalendar } from '@/components/calendar/PropertyCalendar'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { calculateOwnerMetrics, formatRevenue, formatOccupationRate, type OwnerMetrics } from '@/services/metricsService'
import type { Property } from '@/types/database'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-blue-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tableau de bord - Propriétaire
              </h1>
              <p className="text-sm text-gray-600">
                Bienvenue {user?.full_name || user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  Mon profil
                </Button>
              </Link>
              <Button 
                onClick={signOut}
                variant="outline"
              >
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'list' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Mes propriétés
                </h2>
                <p className="text-sm text-gray-600">
                  Gérez vos propriétés et suivez leurs performances
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={handleManageFinances}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Gestion financière
                </Button>
                <Button 
                  onClick={handleGenerateQuotes}
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  Générer un devis
                </Button>
                <Button 
                  onClick={handleAddProperty}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Ajouter une propriété
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Propriétés totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricsLoading ? '...' : metrics.totalProperties}
                  </div>
                  <p className="text-xs text-gray-500">
                    {metricsLoading ? 'Chargement...' : 'Total de vos biens'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Propriétés approuvées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricsLoading ? '...' : metrics.approvedProperties}
                  </div>
                  <p className="text-xs text-gray-500">
                    {metricsLoading ? 'Chargement...' : 'Validées par PJ'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Revenus ce mois
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricsLoading ? '...' : formatRevenue(metrics.monthlyRevenue)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {metricsLoading ? 'Chargement...' : 'Commissions perçues'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Taux d'occupation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricsLoading ? '...' : formatOccupationRate(metrics.occupationRate)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {metricsLoading ? 'Chargement...' : 'Ce mois-ci'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-md">
              <CardHeader className="border-b border-gray-100/50">
                <CardTitle className="text-gray-800">Liste des propriétés</CardTitle>
              </CardHeader>
              <CardContent className="bg-white/50">
                {propertiesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Chargement des propriétés...</div>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{error}</p>
                    <Button 
                      onClick={loadProperties} 
                      variant="outline" 
                      className="mt-2"
                    >
                      Réessayer
                    </Button>
                  </div>
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

            <PropertyCalendar
              property={editingProperty}
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

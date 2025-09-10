import { useState, useEffect, useCallback } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { PropertyList } from '@/components/properties/PropertyList'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { calculateOwnerMetrics, formatRevenue, formatOccupationRate, type OwnerMetrics } from '@/services/metricsService'
import type { Property } from '@/types/database'

type ViewMode = 'list' | 'add' | 'edit'

export function PropertyOwnerDashboard() {
  const { user, signOut, loading } = useAuthStore()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
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
      // Keep default metrics on error
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

  if (!loading && user && user.role !== 'property_owner') {
    return <Navigate to={`/dashboard/${user.role?.replace('_', '-')}`} replace />
  }

  const handleAddProperty = () => {
    setEditingProperty(null)
    setViewMode('add')
  }

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property)
    setViewMode('edit')
  }

  const handleFormSuccess = () => {
    setViewMode('list')
    setEditingProperty(null)
    loadProperties() // Refresh properties after form success
    loadMetrics() // Refresh metrics as well
  }

  const handleFormCancel = () => {
    setViewMode('list')
    setEditingProperty(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
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
        {viewMode === 'list' && (
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
              <Button 
                onClick={handleAddProperty}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Ajouter une propriété
              </Button>
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

            <Card>
              <CardHeader>
                <CardTitle>Liste des propriétés</CardTitle>
              </CardHeader>
              <CardContent>
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
                    onRefresh={handleRefresh}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {(viewMode === 'add' || viewMode === 'edit') && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleFormCancel}
              >
                ← Retour à la liste
              </Button>
              <h2 className="text-xl font-semibold text-gray-900">
                {viewMode === 'add' ? 'Ajouter une propriété' : 'Modifier la propriété'}
              </h2>
            </div>

            <PropertyForm
              property={editingProperty}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}
      </main>
    </div>
  )
}

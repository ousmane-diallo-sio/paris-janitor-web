import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PropertyForm } from '@/components/properties/PropertyForm'
import { PropertyList } from '@/components/properties/PropertyList'
import { useAuthStore } from '@/stores/auth'
import type { Property } from '@/types/database'

type ViewMode = 'list' | 'add' | 'edit'

export function PropertyOwnerDashboard() {
  const { user, signOut, loading } = useAuthStore()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)

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
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-gray-500">En cours de calcul</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Propriétés approuvées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-gray-500">En cours de calcul</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Revenus ce mois
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-€</div>
                  <p className="text-xs text-gray-500">En cours de calcul</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Taux d'occupation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-%</div>
                  <p className="text-xs text-gray-500">En cours de calcul</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Liste des propriétés</CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyList 
                  onEdit={handleEditProperty}
                  onDelete={() => {
                    // Properties are automatically refreshed by PropertyList
                  }}
                />
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
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}
      </main>
    </div>
  )
}

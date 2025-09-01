import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { db } from '@/lib/database'
import { useAuthStore } from '@/stores/auth'
import type { Property } from '@/types/database'

interface PropertyListProps {
  onEdit?: (property: Property) => void
  onDelete?: (propertyId: string) => void
}

export function PropertyList({ onEdit, onDelete }: PropertyListProps) {
  const { user } = useAuthStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProperties = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      const result = await db.properties.getByOwnerId(user.id)
      setProperties(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des propriétés')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) return

    try {
      await db.properties.delete(propertyId)
      setProperties(prev => prev.filter(p => p.id !== propertyId))
      onDelete?.(propertyId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  const getValidationStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approuvée</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejetée</Badge>
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">Chargement des propriétés...</div>
      </div>
    )
  }

  if (error) {
    return (
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
    )
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">Aucune propriété trouvée</div>
        <p className="text-sm text-gray-400">
          Commencez par ajouter votre première propriété
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <Card key={property.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg line-clamp-2">{property.title}</CardTitle>
              {getValidationStatusBadge(property.validation_status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 line-clamp-3">
                {property.description || 'Aucune description'}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Localisation:</span>
                <span className="text-right">{property.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacité:</span>
                <span>{property.capacity} personnes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chambres:</span>
                <span>{property.bedrooms || 0} ch.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prix:</span>
                <span className="font-semibold">{property.nightly_rate}€/nuit</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-xs text-gray-500 mb-3">
                Créée le {new Date(property.created_at || '').toLocaleDateString('fr-FR')}
              </div>
              
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(property)}
                    className="flex-1"
                  >
                    Modifier
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(property.id)}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

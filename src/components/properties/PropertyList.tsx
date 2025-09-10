import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { supabase } from '@/lib/supabase'
import type { Property } from '@/types/database'

interface PropertyListProps {
  properties: Property[]
  onEdit?: (property: Property) => void
  onManageCalendar?: (property: Property) => void
  onRefresh: () => void
}

export function PropertyList({ properties, onEdit, onManageCalendar, onRefresh }: PropertyListProps) {
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = useCallback(async (id: string) => {
    if (!id || isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      console.log('Property deleted successfully');
      // Refresh properties list
      onRefresh();
    } catch (error) {
      console.error('Error deleting property:', error);
      // In a real app, you'd show a toast or error message here
    } finally {
      setIsDeleting(false);
      setDeletingProperty(null);
    }
  }, [isDeleting, onRefresh]);

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
    <>
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
                  {onManageCalendar && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageCalendar(property)}
                      className="flex-1"
                    >
                      Calendrier
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingProperty(property)}
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

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deletingProperty} onOpenChange={() => !isDeleting && setDeletingProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette propriété ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>
                Vous êtes sur le point de supprimer la propriété <strong>"{deletingProperty?.title}"</strong>.
              </div>
              <div className="text-red-600 font-medium">
                ⚠️ Cette action est irréversible et supprimera définitivement :
              </div>
              <ul className="text-sm text-gray-600 ml-4 space-y-1">
                <li>• Toutes les informations de la propriété</li>
                <li>• L'historique des réservations associées</li>
                <li>• Les données de performances</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProperty && handleDelete(deletingProperty.id)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Suppression...</span>
                </div>
              ) : (
                'Supprimer définitivement'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

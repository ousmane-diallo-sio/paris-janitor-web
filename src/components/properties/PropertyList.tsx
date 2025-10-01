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
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { notify, logError } from '@/lib/error-handling'
import type { Property } from '@/types/database'

interface PropertyListProps {
  properties: Property[]
  onEdit?: (property: Property) => void
  onManageCalendar?: (property: Property) => void
  onRefresh: () => void
}

// Image carousel component
function ImageCarousel({ images, alt }: { images: string[], alt: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  if (images.length === 0) {
    // Placeholder for properties without images
    return (
      <div className="aspect-video relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium">Aucune image</p>
        </div>
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={images[0]}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      </div>
    )
  }

  return (
    <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden group">
      <img
        src={images[currentIndex]}
        alt={`${alt} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
        }}
      />
      
      {/* Navigation arrows - always visible but subtle when not hovered */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white rounded-full p-1.5 opacity-70 hover:opacity-100 transition-all duration-200 z-10"
        aria-label="Image précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white rounded-full p-1.5 opacity-70 hover:opacity-100 transition-all duration-200 z-10"
        aria-label="Image suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      
      {/* Dots indicator - always visible */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              index === currentIndex 
                ? 'bg-white shadow-md' 
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Aller à l'image ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Image counter - always visible */}
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
        {currentIndex + 1}/{images.length}
      </div>
      
      {/* Subtle slide indicator for first-time users */}
      {images.length > 1 && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm opacity-80">
          📷 {images.length}
        </div>
      )}
    </div>
  )
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
      
      notify.success('Propriété supprimée avec succès');
      onRefresh();
    } catch (error) {
      logError(error, 'PropertyList.handleDelete');
      notify.error(error, {
        label: 'Réessayer',
        onClick: () => handleDelete(id)
      });
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
          <Card key={property.id} className="overflow-hidden flex flex-col h-[620px] bg-gradient-to-br from-blue-100/80 via-slate-50 to-purple-100/60 border border-blue-200/70 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.01] cursor-pointer">
            {/* Header with title only - full width, fixed 2-line height */}
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg line-clamp-2 leading-tight h-14 flex items-start">
                {property.title}
              </CardTitle>
            </CardHeader>
            
            {/* Image carousel - fixed height */}
            <div className="px-6 pb-4 flex-shrink-0">
              <ImageCarousel 
                images={property.images || []} 
                alt={property.title || 'Propriété'} 
              />
            </div>
            
            {/* Content area - flexible height */}
            <CardContent className="flex flex-col flex-grow">
              {/* Status badge positioned here for better layout */}
              <div className="flex justify-end mb-3">
                {getValidationStatusBadge(property.validation_status)}
              </div>

              {/* Description - fixed height */}
              <div className="mb-4 h-16 flex-shrink-0">
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                  {property.description || 'Aucune description'}
                </p>
              </div>

              {/* Property details - fixed height */}
              <div className="space-y-2 text-sm mb-2 flex-shrink-0">
                <div className="flex justify-between">
                  <span className="text-gray-600">Localisation:</span>
                  <span className="text-right font-medium">{property.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacité:</span>
                  <span className="font-medium">{property.capacity} personnes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chambres:</span>
                  <span className="font-medium">{property.bedrooms || 0} ch.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prix:</span>
                  <span className="font-semibold text-blue-600">{property.nightly_rate}€/nuit</span>
                </div>
              </div>

              {/* Spacer to push buttons to bottom */}
              <div className="flex-grow"></div>

              {/* Footer section - always at bottom */}
              <div className="border-t border-blue-100/50 pt-3 flex-shrink-0">
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

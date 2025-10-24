import { useState, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
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
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/database'
import { notify, logError } from '@/lib/error-handling'
import type { Property } from '@/types/database'

interface PropertyListProps {
  properties: Property[]
  onEdit?: (property: Property) => void
  onManageCalendar?: (property: Property) => void
  onRefresh: () => void
}

function ImageCarousel({ images, alt }: { images: string[], alt: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] relative bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xs font-medium">Aucune image</p>
        </div>
      </div>
    )
  }

  return (
    <div className="aspect-[4/3] relative bg-gray-100 rounded-xl overflow-hidden group">
      <img
        src={images[currentIndex]}
        alt={`${alt} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
        }}
      />
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl z-10"
            aria-label="Image précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl z-10"
            aria-label="Image suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentIndex
                  ? 'bg-white shadow-sm'
                  : 'bg-white/60 hover:bg-white/80'
                  }`}
                aria-label={`Aller à l'image ${index + 1}`}
              />
            ))}
          </div>

          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  )
}

export function PropertyList({ properties, onEdit, onManageCalendar, onRefresh }: PropertyListProps) {
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [propertyRatings, setPropertyRatings] = useState<Record<string, { averageRating: number, reviewCount: number }>>({})

  // Fetch ratings when properties change
  useEffect(() => {
    const fetchRatings = async () => {
      if (properties.length === 0) return
      
      try {
        const propertyIds = properties.map(p => p.id)
        const ratings = await db.reviews.getPropertyRatings(propertyIds)
        setPropertyRatings(ratings)
      } catch (error) {
        console.error('Error fetching property ratings:', error)
      }
    }

    fetchRatings()
  }, [properties])

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
        return <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">Vérifié</Badge>
      case 'rejected':
        return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">Rejeté</Badge>
      case 'pending':
      default:
        return <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">En attente</Badge>
    }
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune propriété trouvée</h3>
        <p className="text-gray-600">
          Commencez par ajouter votre première propriété pour commencer
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.id} className="group cursor-pointer bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="relative">
              <ImageCarousel
                images={property.images || []}
                alt={property.title || 'Propriété'}
              />
              <div className="absolute top-3 left-3">
                {getValidationStatusBadge(property.validation_status)}
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 leading-tight">
                  {property.title}
                </h3>
                {propertyRatings[property.id] ? (
                  <div className="flex items-center ml-2 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 font-medium">
                      {propertyRatings[property.id].averageRating}
                    </span>
                    <span className="ml-1 text-gray-500 text-xs">
                      ({propertyRatings[property.id].reviewCount})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center ml-2 text-sm text-gray-400">
                    <Star className="h-4 w-4" />
                    <span className="ml-1 font-medium">Nouveau</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                {property.description || 'Belle propriété située dans un quartier calme'}
              </p>

              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <div className="flex items-center justify-between">
                  <span>{property.city}</span>
                  <span>{property.capacity} voyageurs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{property.bedrooms || 0} chambres</span>
                  <span>{property.bathrooms || 1} salles de bain</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xl font-bold text-gray-900">{property.nightly_rate}€</span>
                    <span className="text-gray-600 text-sm ml-1">par nuit</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(property.created_at || '').toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <div className="flex gap-2">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(property)}
                      className="flex-1 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    >
                      Modifier
                    </Button>
                  )}
                  {onManageCalendar && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageCalendar(property)}
                      className="flex-1 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    >
                      Calendrier
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingProperty(property)}
                    className="flex-1 rounded-lg text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deletingProperty} onOpenChange={() => !isDeleting && setDeletingProperty(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette propriété ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                Vous êtes sur le point de supprimer la propriété <strong>"{deletingProperty?.title}"</strong>.
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-red-800 font-medium text-sm mb-2">
                  ⚠️ Cette action est irréversible
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Suppression définitive de la propriété</li>
                  <li>• Perte de l'historique des réservations</li>
                  <li>• Suppression des données de performance</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-lg">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProperty && handleDelete(deletingProperty.id)}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg"
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
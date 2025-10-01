import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { db } from '@/lib/database'
import { useAuthStore } from '@/stores/auth'
import { notify, handleAsyncOperation } from '@/lib/error-handling'
import type { TablesInsert, Property } from '@/types/database'

// Mock property data for dev mode
const mockProperties = [
  {
    title: "Studio Moderne Montmartre",
    description: "Charmant studio au cœur de Montmartre avec vue sur Sacré-Cœur. Entièrement rénové avec cuisine équipée, salle de bain moderne et décoration contemporaine. Proche métro Pigalle et Abbesses.",
    address: "15 Rue des Abbesses",
    city: "Paris",
    postal_code: "75018",
    bedrooms: 0,
    bathrooms: 1,
    capacity: 2,
    nightly_rate: 95
  },
  {
    title: "Appartement Hausmannien Marais",
    description: "Magnifique appartement hausmannien de 85m² dans le Marais historique. Poutres apparentes, parquet ancien, cuisine moderne. À 2 minutes de Place des Vosges et des meilleurs restaurants parisiens.",
    address: "8 Rue de Rivoli",
    city: "Paris",
    postal_code: "75004",
    bedrooms: 2,
    bathrooms: 1,
    capacity: 4,
    nightly_rate: 180
  },
  {
    title: "Loft Industriel République",
    description: "Loft industriel unique de 120m² avec mezzanine et terrasse privée. Exposition plein sud, cuisine américaine, espace de travail. Idéal pour séjours d'affaires ou vacances en famille.",
    address: "42 Boulevard du Temple",
    city: "Paris",
    postal_code: "75011",
    bedrooms: 3,
    bathrooms: 2,
    capacity: 6,
    nightly_rate: 250
  },
  {
    title: "Penthouse Tour Eiffel",
    description: "Exceptionnel penthouse avec vue panoramique sur la Tour Eiffel. 150m² sur deux niveaux, terrasse de 40m², prestations haut de gamme. Climatisation, concierge 24h/24.",
    address: "7 Avenue de Suffren",
    city: "Paris",
    postal_code: "75007",
    bedrooms: 4,
    bathrooms: 3,
    capacity: 8,
    nightly_rate: 450
  },
  {
    title: "Maison de Charme Belleville",
    description: "Maison individuelle atypique avec jardin privé dans Belleville village. 3 niveaux, décoration éclectique, cuisine de chef. Au calme tout en restant connecté au dynamisme parisien.",
    address: "23 Rue de la Mare",
    city: "Paris",
    postal_code: "75020",
    bedrooms: 3,
    bathrooms: 2,
    capacity: 6,
    nightly_rate: 160
  }
]

const propertySchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  address: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  postal_code: z.string().min(5, 'Le code postal est requis'),
  bedrooms: z.number().min(0).max(20),
  bathrooms: z.number().min(0).max(10),
  capacity: z.number().min(1).max(50),
  nightly_rate: z.number().min(10).max(10000),
})

type PropertyFormData = z.infer<typeof propertySchema>

interface PropertyFormProps {
  property?: Property | null
  onSuccess: () => void
  onCancel: () => void
}

export function PropertyForm({ property, onSuccess, onCancel }: PropertyFormProps) {
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<string[]>(property?.images || [])
  const [currentMockIndex, setCurrentMockIndex] = useState(0)
  const isEditing = !!property
  const isDevelopment = import.meta.env.DEV

  const getDefaultValues = useCallback((): Partial<PropertyFormData> => {
    if (property) {
      return {
        title: property.title || '',
        description: property.description || '',
        address: property.address || '',
        city: property.city || '',
        postal_code: property.postal_code || '',
        bedrooms: property.bedrooms || 1,
        bathrooms: property.bathrooms || 1,
        capacity: property.capacity || 2,
        nightly_rate: property.nightly_rate || 80,
      }
    }
    return {
      bedrooms: 1,
      bathrooms: 1,
      capacity: 2,
      nightly_rate: 80
    }
  }, [property])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty }
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: getDefaultValues()
  })

  const fillMockData = useCallback(() => {
    const mockData = mockProperties[currentMockIndex]
    setValue('title', mockData.title)
    setValue('description', mockData.description)
    setValue('address', mockData.address)
    setValue('city', mockData.city)
    setValue('postal_code', mockData.postal_code)
    setValue('bedrooms', mockData.bedrooms)
    setValue('bathrooms', mockData.bathrooms)
    setValue('capacity', mockData.capacity)
    setValue('nightly_rate', mockData.nightly_rate)

    setCurrentMockIndex((prev) => {
      let newIndex = prev
      while (newIndex === prev) {
        newIndex = Math.floor(Math.random() * mockProperties.length)
      }
      return newIndex
    })
  }, [currentMockIndex, setValue, setCurrentMockIndex])

  useEffect(() => {
    const defaultValues = getDefaultValues()
    reset(defaultValues)
    setImages(property?.images || [])
  }, [getDefaultValues, reset, property])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault()
        event.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const onSubmit = async (data: PropertyFormData) => {
    if (!user) {
      notify.error('Vous devez être connecté pour effectuer cette action');
      return;
    }

    setIsSubmitting(true);

    const { error } = await handleAsyncOperation(
      async () => {
        if (isEditing && property) {
          const updateData = {
            ...data,
            images,
            updated_at: new Date().toISOString()
          }
          return await db.properties.update(property.id, updateData)
        } else {
          const propertyData: TablesInsert<'properties'> = {
            ...data,
            images,
            owner_id: user.id,
            validation_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          return await db.properties.create(propertyData)
        }
      },
      {
        successMessage: isEditing
          ? 'Propriété modifiée avec succès !'
          : 'Propriété ajoutée avec succès ! Elle sera validée par notre équipe.',
      }
    );

    setIsSubmitting(false);

    if (!error) {
      onSuccess();
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Modifier la propriété' : 'Ajouter une nouvelle propriété'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informations générales</h3>

              <div>
                <Label htmlFor="title">Titre de l'annonce</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Appartement moderne avec vue sur la Seine"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Décrivez votre propriété, ses équipements et son environnement..."
                  className={errors.description ? 'border-red-500' : ''}
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Localisation</h3>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="123 Rue de la Paix"
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="Paris"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    {...register('postal_code')}
                    placeholder="75001"
                    className={errors.postal_code ? 'border-red-500' : ''}
                  />
                  {errors.postal_code && (
                    <p className="text-sm text-red-500 mt-1">{errors.postal_code.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Détails de la propriété</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Chambres</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    max="20"
                    {...register('bedrooms', { valueAsNumber: true })}
                    className={errors.bedrooms ? 'border-red-500' : ''}
                  />
                  {errors.bedrooms && (
                    <p className="text-sm text-red-500 mt-1">{errors.bedrooms.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bathrooms">Salles de bain</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="0"
                    max="10"
                    {...register('bathrooms', { valueAsNumber: true })}
                    className={errors.bathrooms ? 'border-red-500' : ''}
                  />
                  {errors.bathrooms && (
                    <p className="text-sm text-red-500 mt-1">{errors.bathrooms.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Nombre d'invités max</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="50"
                    {...register('capacity', { valueAsNumber: true })}
                    className={errors.capacity ? 'border-red-500' : ''}
                  />
                  {errors.capacity && (
                    <p className="text-sm text-red-500 mt-1">{errors.capacity.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="nightly_rate">Prix par nuit (€)</Label>
                  <Input
                    id="nightly_rate"
                    type="number"
                    min="10"
                    max="10000"
                    {...register('nightly_rate', { valueAsNumber: true })}
                    className={errors.nightly_rate ? 'border-red-500' : ''}
                  />
                  {errors.nightly_rate && (
                    <p className="text-sm text-red-500 mt-1">{errors.nightly_rate.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Photos de la propriété</h3>
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={5}
                propertyId={property?.id}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isEditing ? 'Modifier la propriété' : 'Ajouter la propriété'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
            {isDevelopment && !isEditing && (
        <div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg max-w-sm">
            <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
              🧪 Dev Mode - Propriétés
            </div>
            
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                Propriété actuelle: <span className="font-medium">{mockProperties[currentMockIndex].title}</span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillMockData}
                className="w-full text-xs bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
              >
                🏠 Remplir données ({currentMockIndex + 1}/{mockProperties.length})
              </Button>
              
              <div className="text-xs text-gray-500">
                Chaque clic charge la propriété suivante
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

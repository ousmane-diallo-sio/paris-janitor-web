import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { db } from '@/lib/database'
import { useAuthStore } from '@/stores/auth'
import type { TablesInsert } from '@/types/database'

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
  onSuccess: () => void
  onCancel: () => void
}

export function PropertyForm({ onSuccess, onCancel }: PropertyFormProps) {
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      bedrooms: 1,
      bathrooms: 1,
      capacity: 2,
      nightly_rate: 80
    }
  })

  const onSubmit = async (data: PropertyFormData) => {
    if (!user) return

    setIsSubmitting(true)
    setError('')

    try {
      const propertyData: TablesInsert<'properties'> = {
        ...data,
        owner_id: user.id,
        validation_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await db.properties.create(propertyData)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la propriété')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Ajouter une nouvelle propriété</CardTitle>
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

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
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter la propriété'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

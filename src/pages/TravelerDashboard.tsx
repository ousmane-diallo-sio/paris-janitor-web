import { Navigate, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '../lib/supabase'
import { handleAsyncOperation } from '../lib/error-handling'

interface Property {
  id: string
  title: string
  description: string | null
  address: string
  city: string
  nightly_rate: number
  capacity: number
  images: string[] | null
  profiles: {
    full_name: string
  }
}

export function TravelerDashboard() {
  const { user, signOut, loading } = useAuthStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(true)

  const loadProperties = useCallback(async () => {
    await handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            id,
            title,
            description,
            address,
            city,
            nightly_rate,
            capacity,
            images,
            profiles!owner_id (
              full_name
            )
          `)
          .eq('validation_status', 'approved')
          .limit(6)

        if (error) throw error
        
        const transformedProperties = (data || []).map(property => ({
          id: property.id,
          title: property.title,
          description: property.description,
          address: property.address,
          city: property.city,
          nightly_rate: property.nightly_rate,
          capacity: property.capacity,
          images: property.images,
          profiles: {
            full_name: property.profiles?.full_name || 'Propriétaire'
          }
        }))
        
        setProperties(transformedProperties)
        return transformedProperties
      },
      {
        errorMessage: 'Impossible de charger les logements'
      }
    )
    setPropertiesLoading(false)
  }, [])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

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

  if (!loading && user && user.role !== 'traveler') {
    return <Navigate to={`/dashboard/${user.role?.replace('_', '-')}`} replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Voyageur</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Bonjour, {user?.full_name || user?.email}
              </span>
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  Mon profil
                </Button>
              </Link>
              <Button variant="outline" onClick={signOut}>
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recherche de logements</CardTitle>
              <CardDescription>
                Trouvez le logement parfait pour votre séjour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/search">
                <Button className="w-full">
                  Rechercher des logements
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mes réservations</CardTitle>
              <CardDescription>
                Gérez vos réservations en cours et passées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Voir mes réservations
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Logements disponibles</CardTitle>
              <CardDescription>
                Découvrez nos meilleures offres du moment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Chargement des logements...</p>
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun logement disponible pour le moment
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties.map((property) => (
                    <Card key={property.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                        {property.images && property.images.length > 0 ? (
                          <img 
                            src={property.images[0]} 
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400">Aucune image</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{property.city}</p>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {property.description || 'Aucune description disponible'}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg text-green-600">
                            {property.nightly_rate}€<span className="text-sm font-normal">/nuit</span>
                          </span>
                          <span className="text-sm text-gray-500">
                            {property.capacity} personnes max
                          </span>
                        </div>
                        <Link to={`/property/${property.id}`} className="block mt-3">
                          <Button className="w-full" size="sm">
                            Voir les détails
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

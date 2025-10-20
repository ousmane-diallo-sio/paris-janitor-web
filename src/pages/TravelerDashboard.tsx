import { Navigate, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { StorageImage } from '@/components/ui/storage-image'
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
      <div className="relative bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative">
          <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Bonjour {user?.full_name?.split(' ')[0] || 'voyageur'} !</h1>
                <p className="text-white/90 text-lg mt-1">Où souhaitez-vous séjourner ?</p>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/profile">
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg">
                    Mon profil
                  </Button>
                </Link>
                <Button variant="outline" onClick={signOut} className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg">
                  Se déconnecter
                </Button>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">🏠</span>
                  </div>
                  <CardTitle className="text-white">Recherche de logements</CardTitle>
                  <CardDescription className="text-white/80">
                    Trouvez le logement parfait pour votre séjour
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/search">
                    <Button className="w-full bg-white text-[#2c67f2] hover:bg-gray-100 font-semibold">
                      Rechercher des logements
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">📅</span>
                  </div>
                  <CardTitle className="text-white">Mes réservations</CardTitle>
                  <CardDescription className="text-white/80">
                    Gérez vos réservations en cours et passées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Voir mes réservations
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">🛎️</span>
                  </div>
                  <CardTitle className="text-white">Services supplémentaires</CardTitle>
                  <CardDescription className="text-white/80">
                    Réservez des services pour votre séjour
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/services">
                    <Button className="w-full bg-white text-[#2c67f2] hover:bg-gray-100 font-semibold">
                      Catalogue de services
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Logements disponibles</h2>
              <p className="text-gray-600 mt-2">Découvrez nos meilleures offres du moment</p>
            </div>
            <Link to="/search">
              <Button variant="outline" className="flex items-center gap-2 rounded-lg border-gray-300 hover:bg-gray-50">
                Voir tout
                <span>→</span>
              </Button>
            </Link>
          </div>

          {propertiesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200 rounded-t-lg"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">🏠</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun logement disponible</h3>
              <p className="text-gray-600">Revenez plus tard pour découvrir nos nouvelles offres</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Link key={property.id} to={`/property/${property.id}`}>
                  <Card className="group cursor-pointer bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      {property.images && property.images.length > 0 ? (
                        <StorageImage
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-4xl opacity-40">🏠</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-gray-700">
                          {property.city}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-[#2c67f2] transition-colors">
                          {property.title}
                        </h3>
                        <p className="text-sm text-gray-600">{property.address}</p>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {property.description || 'Logement confortable et bien situé'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>👥 {property.capacity} personnes</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-gray-900">
                              {property.nightly_rate}€
                            </span>
                            <span className="text-sm text-gray-600">/nuit</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

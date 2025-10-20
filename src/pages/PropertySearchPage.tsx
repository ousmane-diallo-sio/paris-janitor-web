import { useState, useEffect, useCallback } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Calendar, Euro, Users, Wifi, Car, Coffee } from 'lucide-react'
import { StorageImage } from '@/components/ui/storage-image'
import type { Property } from '@/types/database'

interface SearchFilters {
  location: string
  checkIn: string
  checkOut: string
  guests: number
  minPrice: number
  maxPrice: number
}

export function PropertySearchPage() {
  const { user, loading } = useAuthStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    minPrice: 0,
    maxPrice: 500
  })

  const filterProperties = useCallback(() => {
    let filtered = properties

    if (filters.location) {
      filtered = filtered.filter(property => 
        property.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
        property.address?.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    if (filters.guests) {
      filtered = filtered.filter(property => 
        (property.capacity || 0) >= filters.guests
      )
    }

    filtered = filtered.filter(property => 
      (property.nightly_rate || 0) >= filters.minPrice &&
      (property.nightly_rate || 0) <= filters.maxPrice
    )

    setFilteredProperties(filtered)
  }, [properties, filters])

  const loadProperties = useCallback(async () => {
    setIsSearching(true)
    setError('')
    
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('validation_status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProperties(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des propriétés')
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && user && user.role === 'traveler') {
      loadProperties()
    }
  }, [loadProperties, loading, user])

  useEffect(() => {
    filterProperties()
  }, [filterProperties])

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

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="h-4 w-4" />
      case 'parking':
        return <Car className="h-4 w-4" />
      case 'cuisine':
        return <Coffee className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard/traveler">
                <Button variant="outline" size="sm">
                  ← Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recherche de logements</h1>
                <p className="text-sm text-gray-600">
                  Trouvez le logement parfait pour votre séjour
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Filtres de recherche</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <Label htmlFor="location" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Destination</span>
                </Label>
                <Input
                  id="location"
                  placeholder="Ville, quartier..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="checkIn" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Arrivée</span>
                </Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={filters.checkIn}
                  onChange={(e) => setFilters({ ...filters, checkIn: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="checkOut">Départ</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={filters.checkOut}
                  onChange={(e) => setFilters({ ...filters, checkOut: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="guests" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Voyageurs</span>
                </Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="10"
                  value={filters.guests}
                  onChange={(e) => setFilters({ ...filters, guests: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div>
                <Label htmlFor="maxPrice" className="flex items-center space-x-2">
                  <Euro className="h-4 w-4" />
                  <span>Prix max/nuit</span>
                </Label>
                <Input
                  id="maxPrice"
                  type="number"
                  min="0"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredProperties.length} logement{filteredProperties.length !== 1 ? 's' : ''} trouvé{filteredProperties.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {isSearching ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Recherche en cours...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200 relative">
                    {property.images && property.images.length > 0 ? (
                      <StorageImage
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <MapPin className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge 
                        variant={property.validation_status === 'approved' ? 'default' : 'secondary'}
                        className="bg-white text-gray-900"
                      >
                        {property.validation_status === 'approved' ? 'Vérifié' : 'En attente'}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="line-clamp-1">{property.address}, {property.city}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {property.capacity} voyageur{(property.capacity || 0) > 1 ? 's' : ''}
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatPrice(property.nightly_rate || 0)}
                          <span className="text-sm font-normal text-gray-600">/nuit</span>
                        </span>
                      </div>

                      {property.amenities && property.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {property.amenities.slice(0, 3).map((amenity, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-600"
                            >
                              {getAmenityIcon(amenity)}
                              <span>{amenity}</span>
                            </div>
                          ))}
                          {property.amenities.length > 3 && (
                            <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-600">
                              +{property.amenities.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Voir les détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isSearching && filteredProperties.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun logement trouvé
              </h3>
              <p className="text-gray-600">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

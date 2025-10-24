import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { Search, MapPin, Star, Clock, Euro } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Select } from '../components/ui/select'
import { useAuthStore } from '../stores/auth'
import { ServiceService } from '../services/serviceService'
import { ServicePricingCalculator } from '../services/pricingService'
import ServiceRequestModal from '../components/ServiceRequestModal'
import { 
  SERVICE_CATEGORIES, 
  SERVICE_CATEGORY_CONFIG,
  PRICE_TYPES,
  type ServiceWithProvider,
  type ServiceCategory
} from '../types/services'

interface ServiceCatalogPageProps {
  onRequestService?: (service: ServiceWithProvider) => void
}

export const ServiceCatalogPage: React.FC<ServiceCatalogPageProps> = ({
  onRequestService
}) => {
  const { user, loading: authLoading } = useAuthStore()
  const [services, setServices] = useState<ServiceWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'name'>('name')

  const [selectedService, setSelectedService] = useState<ServiceWithProvider | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)

  const loadServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = selectedCategory === 'all' 
        ? await ServiceService.getAllServices()
        : await ServiceService.getServicesByCategory(selectedCategory)
      
      setServices(result)
    } catch (err) {
      setError('Failed to load services')
      console.error('Error loading services:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  const filteredAndSortedServices = useMemo(() => {
    let filtered = services

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(query) ||
        (service.description && service.description.toLowerCase().includes(query)) ||
        service.provider.full_name?.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price': {
          const priceA = ServicePricingCalculator.calculatePrice(a, { quantity: 1, isVipTraveler: false })
          const priceB = ServicePricingCalculator.calculatePrice(b, { quantity: 1, isVipTraveler: false })
          return priceA.total - priceB.total
        }
        case 'rating':
          return (b.avg_rating || 0) - (a.avg_rating || 0)
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }, [services, searchQuery, sortBy])

  const formatPrice = (service: ServiceWithProvider) => {
    const pricing = ServicePricingCalculator.calculatePrice(service, { quantity: 1, isVipTraveler: false })
    const formattedPrice = ServicePricingCalculator.formatPrice(pricing.total)
    
    if (service.price_type === 'fixed') {
      return formattedPrice
    } else if (service.price_type === 'hourly') {
      return `${formattedPrice}/h`
    } else if (service.price_type === 'distance') {
      return `${formattedPrice}/km`
    }
    return 'Sur devis'
  }

  const getPriceTypeLabel = (priceType?: string | null) => {
    if (!priceType) return 'Sur devis'
    
    const priceTypeKey = Object.keys(PRICE_TYPES).find(
      key => PRICE_TYPES[key as keyof typeof PRICE_TYPES] === priceType
    ) as keyof typeof PRICE_TYPES
    
    const labels = {
      [PRICE_TYPES.FIXED]: 'Prix fixe',
      [PRICE_TYPES.HOURLY]: 'Par heure',
      [PRICE_TYPES.DISTANCE]: 'Par kilomètre',
      [PRICE_TYPES.VARIABLE]: 'Sur devis'
    }
    
    return priceTypeKey ? labels[PRICE_TYPES[priceTypeKey]] : 'Sur devis'
  }

  const handleRequestService = (service: ServiceWithProvider) => {
    setSelectedService(service)
    setShowRequestModal(true)
    onRequestService?.(service)
  }

  const handleModalClose = () => {
    setShowRequestModal(false)
    setSelectedService(null)
  }

  const handleModalSuccess = () => {
    loadServices()
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des services...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadServices}>Réessayer</Button>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (user.role !== 'traveler') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="relative bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Trouvez le service parfait
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Découvrez nos services de conciergerie premium pour votre propriété
            </p>
            
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-full p-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Que recherchez-vous ?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-4 bg-transparent border-none text-white placeholder-white/70 focus:ring-0 text-lg"
                  />
                </div>
                <Button 
                  className="bg-white text-[#2c67f2] hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full"
                >
                  Rechercher
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div className="sticky top-8 space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Catégories</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      selectedCategory === 'all' 
                        ? 'bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    Tous les services
                  </button>
                  {Object.entries(SERVICE_CATEGORIES).map(([key, category]) => {
                    const config = SERVICE_CATEGORY_CONFIG[category]
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                          selectedCategory === category 
                            ? 'bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="text-lg">{config.icon}</span>
                        <span className="font-medium">{config.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trier par</h3>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as 'price' | 'rating' | 'name')}
                >
                  <option value="name">Nom (A-Z)</option>
                  <option value="price">Prix (croissant)</option>
                  <option value="rating">Note (décroissant)</option>
                </Select>
              </div> */}

              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {filteredAndSortedServices.length} service{filteredAndSortedServices.length !== 1 ? 's' : ''} trouvé{filteredAndSortedServices.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-gray-600 text-sm">
                  {selectedCategory === 'all' ? 'Toutes catégories' : SERVICE_CATEGORY_CONFIG[selectedCategory]?.label}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:w-3/4">
            {filteredAndSortedServices.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun service trouvé</h3>
                <p className="text-gray-600 mb-6">
                  Essayez d'ajuster vos critères de recherche ou parcourez toutes les catégories
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                  }}
                  className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white hover:opacity-90"
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onRequestService={handleRequestService}
                    formatPrice={formatPrice}
                    getPriceTypeLabel={getPriceTypeLabel}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ServiceRequestModal
        service={selectedService}
        isOpen={showRequestModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

interface ServiceCardProps {
  service: ServiceWithProvider
  onRequestService?: (service: ServiceWithProvider) => void
  formatPrice: (service: ServiceWithProvider) => string
  getPriceTypeLabel: (priceType?: string | null) => string
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onRequestService,
  formatPrice,
  getPriceTypeLabel
}) => {
  const getCategoryConfig = (category: string) => {
    const categoryKey = Object.keys(SERVICE_CATEGORIES).find(
      key => SERVICE_CATEGORIES[key as keyof typeof SERVICE_CATEGORIES] === category
    ) as keyof typeof SERVICE_CATEGORIES
    
    return categoryKey ? SERVICE_CATEGORY_CONFIG[SERVICE_CATEGORIES[categoryKey]] : null
  }

  const categoryConfig = getCategoryConfig(service.category)

  return (
    <Card className="group cursor-pointer bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative">
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-6xl opacity-20">
            {categoryConfig?.icon || '🔧'}
          </div>
        </div>
        
        <div className="absolute top-3 left-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-gray-700">
            {categoryConfig?.label || service.category}
          </div>
        </div>
        
        {service.avg_rating && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-gray-700">
                {service.avg_rating.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-[#2c67f2] transition-colors">
            {service.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{service.provider.full_name || 'Prestataire'}</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {service.description || 'Aucune description disponible.'}
        </p>

        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          {service.duration_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{service.duration_minutes} min</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Euro className="w-4 h-4" />
            <span>{getPriceTypeLabel(service.price_type)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(service).split('/')[0]}
              </span>
              {formatPrice(service).includes('/') && (
                <span className="text-sm text-gray-600">
                  /{formatPrice(service).split('/')[1]}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">TTC</span>
          </div>
          
          <Button
            onClick={() => onRequestService?.(service)}
            className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white hover:opacity-90 font-semibold px-6 py-2 rounded-lg transition-all"
          >
            Réserver
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default ServiceCatalogPage
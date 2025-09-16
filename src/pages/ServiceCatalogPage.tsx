import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { Search, Filter, MapPin, Star, Clock, Euro } from 'lucide-react'
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
  const [showFilters, setShowFilters] = useState(false)

  // Service request modal
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

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(query) ||
        (service.description && service.description.toLowerCase().includes(query)) ||
        service.provider.full_name?.toLowerCase().includes(query)
      )
    }

    // Apply sorting
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

  const getCategoryConfig = (category: string) => {
    // Find matching category key
    const categoryKey = Object.keys(SERVICE_CATEGORIES).find(
      key => SERVICE_CATEGORIES[key as keyof typeof SERVICE_CATEGORIES] === category
    ) as keyof typeof SERVICE_CATEGORIES
    
    return categoryKey ? SERVICE_CATEGORY_CONFIG[SERVICE_CATEGORIES[categoryKey]] : null
  }

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
    
    // Find matching price type key
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
    // Refresh services or show success message
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Catalogue de Services</h1>
        <p className="text-gray-600">
          Découvrez nos services de conciergerie pour votre propriété
        </p>
      </div>

      {/* Category Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className="flex items-center gap-2"
          >
            Tous les services
          </Button>
          {Object.entries(SERVICE_CATEGORIES).map(([key, category]) => {
            const config = SERVICE_CATEGORY_CONFIG[category]
            return (
              <Button
                key={key}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className="flex items-center gap-2"
              >
                <span>{config.icon}</span>
                {config.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher un service ou un prestataire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <div className="md:w-48">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as 'price' | 'rating' | 'name')}
            >
              <option value="name">Trier par nom</option>
              <option value="price">Trier par prix</option>
              <option value="rating">Trier par note</option>
            </Select>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-gray-600">
        {filteredAndSortedServices.length} service(s) trouvé(s)
      </div>

      {/* Services Grid */}
      {filteredAndSortedServices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Aucun service trouvé</p>
          <Button onClick={() => {
            setSearchQuery('')
            setSelectedCategory('all')
          }}>
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Service Request Modal */}
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
    // Find matching category key
    const categoryKey = Object.keys(SERVICE_CATEGORIES).find(
      key => SERVICE_CATEGORIES[key as keyof typeof SERVICE_CATEGORIES] === category
    ) as keyof typeof SERVICE_CATEGORIES
    
    return categoryKey ? SERVICE_CATEGORY_CONFIG[SERVICE_CATEGORIES[categoryKey]] : null
  }

  const categoryConfig = getCategoryConfig(service.category)

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* Service Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {categoryConfig?.icon || '🔧'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-600">
              {categoryConfig?.label || service.category}
            </p>
          </div>
        </div>
        {service.avg_rating && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {service.avg_rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4 line-clamp-2">
        {service.description || 'Aucune description disponible.'}
      </p>

      {/* Provider Info */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
        <MapPin className="w-4 h-4" />
        <span>{service.provider.full_name || 'Prestataire'}</span>
      </div>

      {/* Service Details */}
      <div className="space-y-2 mb-4 text-sm">
        {service.duration_minutes && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{service.duration_minutes} min</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-600">
          <Euro className="w-4 h-4" />
          <span>{getPriceTypeLabel(service.price_type)}</span>
        </div>
      </div>

      {/* Price and Action */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-indigo-600">
            {formatPrice(service)}
          </p>
          <p className="text-xs text-gray-500">
            Prix TTC (commission incluse)
          </p>
        </div>
        <Button
          onClick={() => onRequestService?.(service)}
          className="flex items-center gap-2"
        >
          Réserver
        </Button>
      </div>
    </Card>
  )
}

export default ServiceCatalogPage
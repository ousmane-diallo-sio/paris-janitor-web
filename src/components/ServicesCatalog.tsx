import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { supabase } from '../lib/supabase'
import { handleAsyncOperation } from '../lib/error-handling'
import { Search, Clock, User, Calendar } from 'lucide-react'

interface Service {
  id: string
  name: string
  category: string
  description: string | null
  base_price: number
  duration_minutes: number | null
  provider: {
    full_name: string | null
    email: string
  }
}

interface ServiceRequest {
  service_id: string
  requested_date: string
  notes: string
  quantity: number
}

export function ServicesCatalogComponent() {
  const { user } = useAuthStore()
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState<string[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestData, setRequestData] = useState<ServiceRequest>({
    service_id: '',
    requested_date: '',
    notes: '',
    quantity: 1
  })

  const loadServices = useCallback(async () => {
    await handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('services')
          .select(`
            id,
            name,
            category,
            description,
            base_price,
            duration_minutes,
            profiles!provider_id (
              full_name,
              email
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error

        const transformedServices = (data || []).map(service => ({
          id: service.id,
          name: service.name,
          category: service.category,
          description: service.description,
          base_price: service.base_price,
          duration_minutes: service.duration_minutes,
          provider: {
            full_name: service.profiles?.full_name || null,
            email: service.profiles?.email || 'Prestataire'
          }
        }))

        setServices(transformedServices)
        
        const uniqueCategories = [...new Set(transformedServices.map(s => s.category))]
        setCategories(uniqueCategories)
        
        return transformedServices
      },
      {
        errorMessage: 'Impossible de charger le catalogue de services'
      }
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  useEffect(() => {
    let filtered = services

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory)
    }

    setFilteredServices(filtered)
  }, [services, searchTerm, selectedCategory])

  const requestService = (service: Service) => {
    if (!user) return
    
    setSelectedService(service)
    setRequestData(prev => ({ ...prev, service_id: service.id }))
    setShowRequestForm(true)
  }

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !selectedService) return

    await handleAsyncOperation(
      async () => {
        const totalAmount = selectedService.base_price * requestData.quantity

        const { error } = await supabase
          .from('service_requests')
          .insert([{
            service_id: requestData.service_id,
            requester_id: user.id,
            requested_date: requestData.requested_date,
            notes: requestData.notes,
            quantity: requestData.quantity,
            total_amount: totalAmount,
            status: 'pending'
          }])

        if (error) throw error

        setShowRequestForm(false)
        setSelectedService(null)
        setRequestData({
          service_id: '',
          requested_date: '',
          notes: '',
          quantity: 1
        })
      },
      {
        successMessage: 'Demande de service envoyée avec succès !',
        errorMessage: 'Erreur lors de l\'envoi de la demande'
      }
    )
  }

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} €`
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement du catalogue de services...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Catalogue de services</h2>
        <p className="text-gray-600">Découvrez nos services de conciergerie pour votre séjour</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher un service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="w-full md:w-48">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun service trouvé</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all'
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Aucun service n\'est disponible pour le moment.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {service.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      {formatPrice(service.base_price)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {service.description && (
                  <CardDescription className="mb-4 flex-1">
                    {service.description}
                  </CardDescription>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500 gap-4">
                    {service.duration_minutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration_minutes} min</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{service.provider.full_name || 'Prestataire'}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => requestService(service)}
                    disabled={!user}
                  >
                    {user ? 'Demander ce service' : 'Se connecter pour réserver'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showRequestForm && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Demander le service</CardTitle>
              <CardDescription>
                {selectedService.name} - {formatPrice(selectedService.base_price)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitRequest} className="space-y-4">
                <div>
                  <Label htmlFor="requested_date">Date souhaitée</Label>
                  <Input
                    id="requested_date"
                    type="datetime-local"
                    value={requestData.requested_date}
                    onChange={(e) => setRequestData(prev => ({ ...prev, requested_date: e.target.value }))}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={requestData.quantity}
                    onChange={(e) => setRequestData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes supplémentaires (optionnel)</Label>
                  <textarea
                    id="notes"
                    className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={requestData.notes}
                    onChange={(e) => setRequestData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Détails spécifiques, instructions particulières..."
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total estimé:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatPrice(selectedService.base_price * requestData.quantity)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Envoyer la demande
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowRequestForm(false)
                      setSelectedService(null)
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

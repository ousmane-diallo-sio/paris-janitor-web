import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { supabase } from '../lib/supabase'
import { handleAsyncOperation } from '../lib/error-handling'
import { Plus, Edit, Trash2, Euro, Clock, Tag } from 'lucide-react'

interface Service {
  id: string
  name: string
  category: string
  description: string | null
  base_price: number
  duration_minutes: number | null
  is_active: boolean | null
}

interface ServiceFormData {
  name: string
  category: string
  description: string
  base_price: number
  duration_minutes: number
}

export function ServiceManagementComponent() {
  const { user } = useAuthStore()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    category: '',
    description: '',
    base_price: 0,
    duration_minutes: 60
  })

  const loadServices = useCallback(async () => {
    if (!user) return

    await handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setServices(data || [])
        return data
      },
      {
        errorMessage: 'Impossible de charger vos services'
      }
    )
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      base_price: 0,
      duration_minutes: 60
    })
    setEditingService(null)
    setShowAddForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    const operation = editingService ? 'update' : 'insert'
    
    await handleAsyncOperation(
      async () => {
        if (editingService) {
          const { error } = await supabase
            .from('services')
            .update({
              name: formData.name,
              category: formData.category,
              description: formData.description,
              base_price: formData.base_price,
              duration_minutes: formData.duration_minutes,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingService.id)

          if (error) throw error

          setServices(prev => prev.map(service => 
            service.id === editingService.id 
              ? { ...service, ...formData, updated_at: new Date().toISOString() }
              : service
          ))
        } else {
          const { data, error } = await supabase
            .from('services')
            .insert([{
              name: formData.name,
              category: formData.category,
              description: formData.description,
              base_price: formData.base_price,
              duration_minutes: formData.duration_minutes,
              provider_id: user.id,
              is_active: true
            }])
            .select()
            .single()

          if (error) throw error

          setServices(prev => [data, ...prev])
        }

        resetForm()
      },
      {
        successMessage: `Service ${operation === 'update' ? 'modifié' : 'créé'} avec succès !`,
        errorMessage: `Erreur lors de la ${operation === 'update' ? 'modification' : 'création'} du service`
      }
    )
  }

  const toggleServiceStatus = async (service: Service) => {
    await handleAsyncOperation(
      async () => {
        const newStatus = !service.is_active
        const { error } = await supabase
          .from('services')
          .update({ is_active: newStatus })
          .eq('id', service.id)

        if (error) throw error

        setServices(prev => prev.map(s => 
          s.id === service.id ? { ...s, is_active: newStatus } : s
        ))
      },
      {
        successMessage: `Service ${service.is_active ? 'désactivé' : 'activé'} avec succès !`,
        errorMessage: 'Erreur lors de la modification du statut'
      }
    )
  }

  const deleteService = async (service: Service) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.name}" ?`)) {
      return
    }

    await handleAsyncOperation(
      async () => {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', service.id)

        if (error) throw error

        setServices(prev => prev.filter(s => s.id !== service.id))
      },
      {
        successMessage: 'Service supprimé avec succès !',
        errorMessage: 'Erreur lors de la suppression du service'
      }
    )
  }

  const startEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description || '',
      base_price: service.base_price,
      duration_minutes: service.duration_minutes || 60
    })
    setShowAddForm(true)
  }

  const getStatusBadge = (isActive: boolean | null) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? 'Actif' : 'Inactif'}
      </Badge>
    )
  }

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} €`
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement de vos services...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des services</h2>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un service
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingService ? 'Modifier le service' : 'Nouveau service'}
            </CardTitle>
            <CardDescription>
              {editingService ? 'Modifiez les informations de votre service' : 'Ajoutez un nouveau service à votre catalogue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du service</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="ex: Ménage appartement"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Input
                    id="category"
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                    placeholder="ex: Nettoyage, Maintenance, Conciergerie"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez votre service en détail..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_price">Prix de base (€)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration_minutes">Durée estimée (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    min="5"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit">
                  {editingService ? 'Modifier' : 'Créer'} le service
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {services.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun service</h3>
            <p className="text-gray-500 mb-6">Vous n'avez pas encore créé de services.</p>
            <Button onClick={() => setShowAddForm(true)}>
              Créer votre premier service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                      {getStatusBadge(service.is_active)}
                      <Badge variant="outline">{service.category}</Badge>
                    </div>
                    
                    {service.description && (
                      <p className="text-gray-600 mb-4">{service.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        <span className="font-medium text-gray-900">
                          {formatPrice(service.base_price)}
                        </span>
                      </div>
                      
                      {service.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{service.duration_minutes} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleServiceStatus(service)}
                    >
                      {service.is_active ? 'Désactiver' : 'Activer'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(service)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Modifier
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteService(service)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

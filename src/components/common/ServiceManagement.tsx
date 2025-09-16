import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, Wrench, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'
import { handleAsyncOperation } from '../../lib/error-handling'
import type { Database } from '../../types/supabase'

type Service = Database['public']['Tables']['services']['Row']

const CATEGORIES = [
  { value: 'cleaning', label: 'Nettoyage', icon: Sparkles },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench },
  { value: 'concierge', label: 'Conciergerie', icon: Plus }
] as const

const PRICE_TYPES = [
  { value: 'fixed', label: 'Prix fixe' },
  { value: 'hourly', label: 'Prix par heure' },
  { value: 'distance', label: 'Prix par km' },
  { value: 'variable', label: 'Prix variable' }
] as const

interface ServiceFormData {
  name: string
  description: string
  category: string
  price_type: string
  base_price: string
  duration_minutes: string
}

interface ServiceManagementProps {
  className?: string
}

export const ServiceManagement: React.FC<ServiceManagementProps> = ({
  className = ''
}) => {
  const { user } = useAuthStore()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Service | null>(null)
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category: '',
    price_type: '',
    base_price: '',
    duration_minutes: ''
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
      },
      {
        errorMessage: 'Erreur lors du chargement des services'
      }
    )
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  const createService = async () => {
    if (!user) return
    
    await handleAsyncOperation(
      async () => {
        const { error } = await supabase
          .from('services')
          .insert([{
            name: formData.name,
            description: formData.description,
            category: formData.category,
            price_type: formData.price_type,
            base_price: Math.round(parseFloat(formData.base_price) * 100),
            duration_minutes: parseInt(formData.duration_minutes),
            provider_id: user.id,
            is_active: true
          }])

        if (error) throw error
        
        setFormData({
          name: '',
          description: '',
          category: '',
          price_type: '',
          base_price: '',
          duration_minutes: ''
        })
        setShowForm(false)
        await loadServices()
      },
      {
        successMessage: 'Service créé avec succès !',
        errorMessage: 'Erreur lors de la création du service'
      }
    )
  }

  const updateService = async () => {
    if (!user || !editingService) return
    
    await handleAsyncOperation(
      async () => {
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            price_type: formData.price_type,
            base_price: Math.round(parseFloat(formData.base_price) * 100),
            duration_minutes: parseInt(formData.duration_minutes)
          })
          .eq('id', editingService.id)

        if (error) throw error
        
        setEditingService(null)
        setFormData({
          name: '',
          description: '',
          category: '',
          price_type: '',
          base_price: '',
          duration_minutes: ''
        })
        setShowForm(false)
        await loadServices()
      },
      {
        successMessage: 'Service modifié avec succès !',
        errorMessage: 'Erreur lors de la modification du service'
      }
    )
  }

  const deleteService = async (service: Service) => {
    await handleAsyncOperation(
      async () => {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', service.id)

        if (error) throw error
        
        setDeleteConfirm(null)
        await loadServices()
      },
      {
        successMessage: 'Service supprimé avec succès !',
        errorMessage: 'Erreur lors de la suppression du service'
      }
    )
  }

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    await handleAsyncOperation(
      async () => {
        const { error } = await supabase
          .from('services')
          .update({ is_active: !currentStatus })
          .eq('id', serviceId)

        if (error) throw error
        await loadServices()
      },
      {
        errorMessage: 'Erreur lors de la modification du statut'
      }
    )
  }

  const formatPrice = (basePrice: number, priceType: string | null) => {
    const euros = (basePrice / 100).toFixed(2)
    switch (priceType) {
      case 'hourly': return `${euros}€/h`
      case 'distance': return `${euros}€/km`
      case 'variable': return 'Sur devis'
      default: return `${euros}€`
    }
  }

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category)
    return cat?.label || category
  }

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category)
    return cat?.icon || Plus
  }

  const startEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category,
      price_type: service.price_type || 'fixed',
      base_price: (service.base_price / 100).toString(),
      duration_minutes: (service.duration_minutes || 60).toString()
    })
    setShowForm(true)
  }

  const startCreate = () => {
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      category: '',
      price_type: '',
      base_price: '',
      duration_minutes: ''
    })
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des services...</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Services</h2>
          <p className="text-gray-600">Gérez vos services et leurs tarifs</p>
        </div>
        <Button onClick={startCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un service
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 p-6 bg-indigo-50/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-indigo-900">{editingService ? 'Modifier le service' : 'Nouveau service'}</CardTitle>
            <CardDescription>
              {editingService ? 'Modifiez les informations de votre service' : 'Créez un nouveau service pour vos clients'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom du service</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Nettoyage complet"
                />
              </div>
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="flex items-center justify-between">
                Description
                <span className="text-xs text-gray-500">
                  {formData.description.length}/2000 caractères
                </span>
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 2000) {
                    setFormData({ ...formData, description: e.target.value })
                    // Auto-resize
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.max(e.target.scrollHeight, 128) + 'px'
                  }
                }}
                placeholder="Décrivez votre service en détail... Quels sont les avantages ? Que comprend ce service ? Quelles sont vos qualifications ?"
                className="min-h-32 w-full rounded-lg border-0 bg-white/95 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden transition-all duration-200 shadow-sm hover:shadow-sm focus:shadow-md backdrop-blur-sm m-1"
                style={{ minHeight: '8rem' }}
                maxLength={2000}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price_type">Type de prix</Label>
                <Select
                  value={formData.price_type}
                  onValueChange={(value) => setFormData({ ...formData, price_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de prix" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="base_price">Prix (€)</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="ex: 50.00"
                />
              </div>
              <div>
                <Label htmlFor="duration">Durée (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  placeholder="ex: 120"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={editingService ? updateService : createService} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {editingService ? 'Modifier le service' : 'Créer le service'}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {services.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Plus className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun service créé
          </h3>
          <p className="text-gray-600 mb-4">
            Commencez par ajouter votre premier service pour recevoir des demandes.
          </p>
          <Button onClick={startCreate} className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Créer mon premier service
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service) => {
            const IconComponent = getCategoryIcon(service.category)
            const categoryColors = {
              cleaning: 'border-l-rose-500 bg-gradient-to-br from-white via-rose-50/20 to-pink-100/40',
              maintenance: 'border-l-orange-500 bg-gradient-to-br from-white via-orange-50/20 to-amber-100/40',
              concierge: 'border-l-indigo-500 bg-gradient-to-br from-white via-indigo-50/20 to-purple-100/40'
            }
            const iconColors = {
              cleaning: 'bg-gradient-to-br from-rose-100 to-pink-200 text-rose-600',
              maintenance: 'bg-gradient-to-br from-orange-100 to-amber-200 text-orange-600', 
              concierge: 'bg-gradient-to-br from-indigo-100 to-purple-200 text-indigo-600'
            }
            const categoryBadgeColors = {
              cleaning: 'text-rose-700 bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200',
              maintenance: 'text-orange-700 bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200',
              concierge: 'text-indigo-700 bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200'
            }
            const priceColors = {
              cleaning: 'text-rose-600',
              maintenance: 'text-orange-600',
              concierge: 'text-indigo-600'
            }
            
            return (
              <Card key={service.id} className={`p-6 hover:shadow-md transition-all duration-200 border-l-4 ${categoryColors[service.category as keyof typeof categoryColors] || categoryColors.cleaning}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${iconColors[service.category as keyof typeof iconColors] || iconColors.cleaning}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg mb-1 break-words">{service.name}</h3>
                      <p className={`text-sm font-medium px-2 py-1 rounded-full inline-block ${categoryBadgeColors[service.category as keyof typeof categoryBadgeColors] || categoryBadgeColors.cleaning}`}>
                        {getCategoryLabel(service.category)}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={service.is_active ? 'default' : 'secondary'} 
                    className={service.is_active 
                      ? 'bg-gradient-to-r from-lime-500 to-emerald-500 text-white shadow-md hover:from-lime-600 hover:to-emerald-600 border-0' 
                      : 'bg-gradient-to-r from-slate-400 to-gray-500 text-white'
                    }
                  >
                    {service.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>

                <div className="bg-white/50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {service.description 
                      ? service.description.length > 120 
                        ? `${service.description.substring(0, 120)}...`
                        : service.description
                      : 'Aucune description fournie pour ce service.'
                    }
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className={`text-2xl font-bold ${priceColors[service.category as keyof typeof priceColors] || priceColors.cleaning}`}>
                      {formatPrice(service.base_price, service.price_type)}
                    </p>
                    <span className="text-sm text-gray-500">
                      {service.price_type === 'hourly' ? 'par heure' : 
                       service.price_type === 'distance' ? 'par km' :
                       service.price_type === 'variable' ? '' : 'prix fixe'}
                    </span>
                  </div>
                  {service.duration_minutes && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">
                        Durée estimée: {service.duration_minutes} minutes
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(service)}
                    className="flex-1 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:border-teal-400 hover:text-teal-700 transition-all duration-200"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleServiceStatus(service.id, service.is_active || false)}
                    className={`transition-all duration-200 ${service.is_active 
                      ? 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:border-orange-400 hover:text-orange-700' 
                      : 'hover:bg-gradient-to-r hover:from-lime-50 hover:to-emerald-50 hover:border-lime-400 hover:text-lime-700'
                    }`}
                    title={service.is_active ? 'Désactiver le service' : 'Activer le service'}
                  >
                    {service.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(service)}
                    className="hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:border-red-400 text-red-600 hover:text-red-700 transition-all duration-200"
                    title="Supprimer le service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le service</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deleteConfirm?.name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirm && deleteService(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ServiceManagement
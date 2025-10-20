import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, Wrench, Sparkles, Crown, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog'
import { ImageUpload } from '../ui/image-upload'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'
import { handleAsyncOperation } from '../../lib/error-handling'
import type { Database } from '../../types/supabase'
import { getSignedUrl } from '../../services/imageService'

type Service = Database['public']['Tables']['services']['Row']

const mockServices = [
  {
    name: "Nettoyage Complet Premium",
    description: "Service de nettoyage haut de gamme incluant toutes les surfaces, équipements et recoins. Produits écologiques premium, aspirateur professionnel, nettoyage vitres intérieur/extérieur. Idéal pour changement de locataires ou grand ménage saisonnier.",
    category: "cleaning",
    price_type: "fixed",
    base_price: "120.00",
    duration_minutes: "180",
    is_vip_only: false,
    qualifications_required: ["certification_nettoyage", "assurance_responsabilite"],
    tags: ["eco-friendly", "premium", "deep-clean"]
  },
  {
    name: "Maintenance Électrique d'Urgence",
    description: "Intervention rapide pour tous problèmes électriques : panne de courant, disjoncteur qui saute, prises défaillantes, éclairage. Électricien certifié disponible 7j/7. Diagnostic gratuit, devis transparent avant intervention.",
    category: "maintenance",
    price_type: "hourly",
    base_price: "85.00",
    duration_minutes: "90",
    is_vip_only: false,
    qualifications_required: ["electricien_certifie", "habilitation_electrique"],
    tags: ["urgence", "24h", "electricite"]
  },
  {
    name: "Conciergerie Express Check-in",
    description: "Service d'accueil personnalisé pour vos invités : remise des clés, visite guidée du logement, explication des équipements, recommandations locales. Disponible même en soirée et week-end pour un accueil chaleureux garanti.",
    category: "concierge",
    price_type: "fixed",
    base_price: "45.00",
    duration_minutes: "30",
    is_vip_only: false,
    qualifications_required: ["formation_accueil"],
    tags: ["check-in", "accueil", "weekend"]
  },
  {
    name: "Nettoyage Express Inter-Séjours",
    description: "Nettoyage rapide et efficace entre deux séjours : changement linge, aspirateur, surfaces de contact, salle de bain, contrôle équipements. Service optimisé pour rotations rapides, garantie propreté maximale.",
    category: "cleaning",
    price_type: "fixed",
    base_price: "75.00",
    duration_minutes: "90",
    is_vip_only: false,
    qualifications_required: ["certification_nettoyage"],
    tags: ["express", "inter-sejours", "rapide"]
  },
  {
    name: "Réparation Plomberie Urgente",
    description: "Intervention d'urgence plomberie 24h/24 : fuites, canalisations bouchées, problèmes chauffage, chasse d'eau défaillante. Plombier professionnel équipé, pièces de rechange standard incluses.",
    category: "maintenance",
    price_type: "hourly",
    base_price: "95.00",
    duration_minutes: "120",
    is_vip_only: false,
    qualifications_required: ["plombier_certifie", "assurance_decennale"],
    tags: ["urgence", "plomberie", "24h"]
  },
  {
    name: "Service Chauffeur VIP",
    description: "Transport premium avec chauffeur privé pour vos invités : aéroport, gare, sorties culturelles. Véhicule haut de gamme, chauffeur multilingue, service personnalisé. Tarification transparente au kilomètre.",
    category: "concierge",
    price_type: "distance",
    base_price: "2.50",
    duration_minutes: "60",
    is_vip_only: true,
    qualifications_required: ["permis_vtc", "formation_service"],
    tags: ["vip", "transport", "luxury"]
  }
]

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
  is_vip_only: boolean
  qualifications_required: string[]
  tags: string[]
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
  const [currentMockIndex, setCurrentMockIndex] = useState(0)
  const [images, setImages] = useState<string[]>([])
  const [qualificationInput, setQualificationInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category: '',
    price_type: '',
    base_price: '',
    duration_minutes: '',
    is_vip_only: false,
    qualifications_required: [],
    tags: []
  })

  const isDevelopment = import.meta.env.DEV

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

        await Promise.all(data.map(async (service) => {
          if (service.image_url) {
            const signedImageUrl = await getSignedUrl(service.image_url)
            service.image_url = signedImageUrl
          }
        }))

        setServices(data || [])
      },
      {
        errorMessage: 'Erreur lors du chargement des services'
      }
    )
    setLoading(false)
  }, [user])

  const fillMockData = useCallback(() => {
    const mockData = mockServices[currentMockIndex]
    setFormData({
      name: mockData.name,
      description: mockData.description,
      category: mockData.category,
      price_type: mockData.price_type,
      base_price: mockData.base_price,
      duration_minutes: mockData.duration_minutes,
      is_vip_only: mockData.is_vip_only,
      qualifications_required: mockData.qualifications_required,
      tags: mockData.tags
    })

    setCurrentMockIndex((prev) => {
      let newIndex = prev
      while (newIndex === prev) {
        newIndex = Math.floor(Math.random() * mockServices.length)
      }
      return newIndex
    })
  }, [currentMockIndex, setCurrentMockIndex])

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
            is_vip_only: formData.is_vip_only,
            qualifications_required: formData.qualifications_required,
            tags: formData.tags,
            image_url: images.length > 0 ? images[0] : null,
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
          duration_minutes: '',
          is_vip_only: false,
          qualifications_required: [],
          tags: []
        })
        setImages([])
        setQualificationInput('')
        setTagInput('')
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
            duration_minutes: parseInt(formData.duration_minutes),
            is_vip_only: formData.is_vip_only,
            qualifications_required: formData.qualifications_required,
            tags: formData.tags,
            image_url: images.length > 0 ? images[0] : null
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
          duration_minutes: '',
          is_vip_only: false,
          qualifications_required: [],
          tags: []
        })
        setImages([])
        setQualificationInput('')
        setTagInput('')
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
      duration_minutes: (service.duration_minutes || 60).toString(),
      is_vip_only: service.is_vip_only || false,
      qualifications_required: service.qualifications_required || [],
      tags: service.tags || []
    })
    setImages(service.image_url ? [service.image_url] : [])
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
      duration_minutes: '',
      is_vip_only: false,
      qualifications_required: [],
      tags: []
    })
    setImages([])
    setQualificationInput('')
    setTagInput('')
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 bg-gradient-to-r from-[#62cff4] to-[#2c67f2] mx-auto mb-4 opacity-80"></div>
          <p className="text-gray-600">Chargement des services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes Services</h1>
            <p className="text-blue-100">Gérez vos services et leurs tarifs</p>
          </div>
          <Button
            onClick={startCreate}
            variant="secondary"
            className="bg-white/90 text-blue-600 hover:bg-white font-medium px-6 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un service
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingService ? 'Modifier le service' : 'Nouveau service'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {editingService ? 'Modifiez les informations de votre service' : 'Créez un nouveau service pour vos clients'}
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">Nom du service</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Nettoyage complet"
                  className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>
              <div>
                <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-2 block">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400/20">
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
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                Description
                <span className="text-xs text-gray-500 font-normal">
                  {formData.description.length}/2000 caractères
                </span>
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 2000) {
                    setFormData({ ...formData, description: e.target.value })
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.max(e.target.scrollHeight, 128) + 'px'
                  }
                }}
                placeholder="Décrivez votre service en détail... Quels sont les avantages ? Que comprend ce service ? Quelles sont vos qualifications ?"
                className="min-h-32 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none resize-none overflow-hidden transition-all duration-200"
                style={{ minHeight: '8rem' }}
                maxLength={2000}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price_type" className="text-sm font-medium text-gray-700 mb-2 block">Type de prix</Label>
                <Select
                  value={formData.price_type}
                  onValueChange={(value) => setFormData({ ...formData, price_type: value })}
                >
                  <SelectTrigger className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400/20">
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
                <Label htmlFor="base_price" className="text-sm font-medium text-gray-700 mb-2 block">Prix (€)</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="ex: 50.00"
                  className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>
              <div>
                <Label htmlFor="duration" className="text-sm font-medium text-gray-700 mb-2 block">Durée (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  placeholder="ex: 120"
                  className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_vip_only"
                  checked={formData.is_vip_only}
                  onChange={(e) => setFormData({ ...formData, is_vip_only: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="is_vip_only" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Service VIP uniquement
                </Label>
              </div>

              <div>
                <Label htmlFor="qualifications" className="text-sm font-medium text-gray-700 mb-2 block">
                  Qualifications requises
                </Label>
                <Input
                  id="qualifications"
                  value={qualificationInput}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.includes(',')) {
                      const newQualifications = value.split(',').map(q => q.trim()).filter(q => q)
                      if (newQualifications.length > 0) {
                        setFormData({
                          ...formData,
                          qualifications_required: [...formData.qualifications_required, ...newQualifications]
                        })
                      }
                      setQualificationInput('')
                    } else {
                      setQualificationInput(value)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const value = qualificationInput.trim()
                      if (value) {
                        setFormData({
                          ...formData,
                          qualifications_required: [...formData.qualifications_required, value]
                        })
                        setQualificationInput('')
                      }
                    }
                  }}
                  placeholder="Tapez une qualification et appuyez sur Entrée ou utilisez une virgule"
                  className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                />
                {formData.qualifications_required.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.qualifications_required.map((qualification, index) => (
                      <div key={index} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-200">
                        <span>{qualification}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            qualifications_required: formData.qualifications_required.filter((_, i) => i !== index)
                          })}
                          className="ml-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="tags" className="text-sm font-medium text-gray-700 mb-2 block">
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.includes(',')) {
                      const newTags = value.split(',').map(t => t.trim()).filter(t => t)
                      if (newTags.length > 0) {
                        setFormData({
                          ...formData,
                          tags: [...formData.tags, ...newTags]
                        })
                      }
                      setTagInput('')
                    } else {
                      setTagInput(value)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const value = tagInput.trim()
                      if (value) {
                        setFormData({
                          ...formData,
                          tags: [...formData.tags, value]
                        })
                        setTagInput('')
                      }
                    }
                  }}
                  placeholder="Tapez un tag et appuyez sur Entrée ou utilisez une virgule"
                  className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                />
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm border border-green-200">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            tags: formData.tags.filter((_, i) => i !== index)
                          })}
                          className="ml-1 text-green-500 hover:text-green-700 hover:bg-green-100 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Image du service</Label>
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={1}
                type="services"
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <Button
                onClick={editingService ? updateService : createService}
                className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#4bb8e8] hover:to-[#1e5ae6] text-white px-6 py-2 rounded-lg font-medium"
              >
                {editingService ? 'Modifier le service' : 'Créer le service'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 px-6 py-2 rounded-lg"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDevelopment && showForm && !editingService && (
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg max-w-sm">
            <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
              🧪 Dev Mode - Services
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                Service actuel: <span className="font-medium">{mockServices[currentMockIndex].name}</span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillMockData}
                className="w-full text-xs bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
              >
                🔧 Remplir données ({currentMockIndex + 1}/{mockServices.length})
              </Button>

              <div className="text-xs text-gray-500">
                Chaque clic charge le service suivant
              </div>
            </div>
          </div>
        </div>
      )}

      {!showForm && (
        services.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Aucun service créé
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Commencez par ajouter votre premier service pour recevoir des demandes de vos clients.
            </p>
            <Button
              onClick={startCreate}
              className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#4bb8e8] hover:to-[#1e5ae6] text-white px-6 py-3 rounded-lg font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer mon premier service
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {services.map((service) => {
              const IconComponent = getCategoryIcon(service.category)

              return (
                <Card key={service.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden group">
                  {service.image_url && (
                    <div className="aspect-video w-full bg-gray-100 overflow-hidden">
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl">
                          <IconComponent className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg break-words">{service.name}</h3>
                            {service.is_vip_only && (
                              <span title="Service VIP">
                                <Crown className="w-4 h-4 text-yellow-500" />
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {getCategoryLabel(service.category)}
                          </span>
                        </div>
                      </div>
                      <Badge
                        className={service.is_active
                          ? 'bg-green-100 text-green-700 border-0 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-500 border-0'
                        }
                      >
                        {service.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {service.description
                          ? service.description.length > 120
                            ? `${service.description.substring(0, 120)}...`
                            : service.description
                          : 'Aucune description fournie pour ce service.'
                        }
                      </p>
                    </div>

                    {service.tags && service.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {service.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {service.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{service.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-2">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatPrice(service.base_price, service.price_type)}
                        </p>
                        <span className="text-sm text-gray-500">
                          {service.price_type === 'hourly' ? 'par heure' :
                            service.price_type === 'distance' ? 'par km' :
                              service.price_type === 'variable' ? '' : 'prix fixe'}
                        </span>
                      </div>
                      {service.duration_minutes && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm">
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
                        className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleServiceStatus(service.id, service.is_active || false)}
                        className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg"
                        title={service.is_active ? 'Désactiver le service' : 'Activer le service'}
                      >
                        {service.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(service)}
                        className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Supprimer le service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )
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
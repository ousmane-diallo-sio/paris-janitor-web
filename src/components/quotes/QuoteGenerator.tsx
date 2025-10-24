import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Calculator, 
  FileText, 
  Download, 
  Plus, 
  Minus, 
  Home,
  Users,
  Euro,
  Percent,
  History,
  Eye,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { exportQuoteFromElement } from '@/services/pdfExportService'
import { QuoteTemplate } from '@/components/quotes/QuoteTemplate'
import { toast } from 'sonner'
import type { Property, Service } from '@/types/database'

interface QuoteItem {
  id: string
  type: 'service' | 'cleaning' | 'maintenance' | 'other'
  name: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface QuoteData {
  id?: string
  propertyId: string
  clientName: string
  clientEmail: string
  validUntil: string
  items: QuoteItem[]
  subtotal: number
  commission: number
  total: number
  notes: string
}

export type { QuoteData, QuoteItem }

const mockQuotes = [
  {
    clientName: "Marie Dubois",
    clientEmail: "marie.dubois@email.com",
    validUntil: "2025-11-20",
    notes: "Client régulier - Appartement 2 pièces avec terrasse. Prévoir nettoyage approfondi des vitres extérieures et entretien des plantes. Accès par code d'entrée 1234A.",
    items: [
      {
        id: "item-1",
        type: "cleaning" as const,
        name: "Nettoyage Complet Premium",
        description: "Nettoyage approfondi de toutes les surfaces, aspirateur professionnel, produits écologiques premium",
        quantity: 1,
        unitPrice: 12000,
        total: 12000
      },
      {
        id: "item-2", 
        type: "maintenance" as const,
        name: "Vérification Équipements",
        description: "Contrôle et maintenance préventive des équipements électroménagers et systèmes",
        quantity: 1,
        unitPrice: 4500,
        total: 4500
      }
    ]
  },
  {
    clientName: "Jean-Pierre Martin",
    clientEmail: "jp.martin@business.fr",
    validUntil: "2025-12-15",
    notes: "Séjour professionnel - Studio moderne centre ville. Client VIP avec exigences élevées. Prestation express demandée avant 14h. Facturation entreprise.",
    items: [
      {
        id: "item-1",
        type: "service" as const,
        name: "Conciergerie Express Check-in",
        description: "Accueil personnalisé, remise des clés, visite guidée du logement, recommandations locales",
        quantity: 1,
        unitPrice: 4500,
        total: 4500
      },
      {
        id: "item-2",
        type: "cleaning" as const,
        name: "Nettoyage Express Inter-Séjours",
        description: "Nettoyage rapide et efficace entre deux séjours, changement linge, surfaces de contact",
        quantity: 1,
        unitPrice: 7500,
        total: 7500
      },
      {
        id: "item-3",
        type: "service" as const,
        name: "Service Chauffeur VIP",
        description: "Transport premium avec chauffeur privé, véhicule haut de gamme, service personnalisé",
        quantity: 25,
        unitPrice: 250,
        total: 6250
      }
    ]
  },
  {
    clientName: "Sophie Chen",
    clientEmail: "sophie.chen@gmail.com",
    validUntil: "2025-11-30",
    notes: "Famille avec enfants en bas âge. Appartement 3 pièces avec équipements bébé. Attention particulière aux produits de nettoyage (non toxiques uniquement). Parking privé disponible.",
    items: [
      {
        id: "item-1",
        type: "cleaning" as const,
        name: "Nettoyage Familial Sécurisé",
        description: "Nettoyage avec produits non-toxiques adaptés aux familles avec enfants en bas âge",
        quantity: 2,
        unitPrice: 8500,
        total: 17000
      },
      {
        id: "item-2",
        type: "maintenance" as const,
        name: "Sécurisation Équipements Enfants",
        description: "Vérification et sécurisation des équipements pour enfants, installation cache-prises",
        quantity: 1,
        unitPrice: 6000,
        total: 6000
      }
    ]
  },
  {
    clientName: "Alessandro Rossi",
    clientEmail: "a.rossi@italia.it", 
    validUntil: "2025-12-25",
    notes: "Client international - Duplex de luxe avec jacuzzi. Séjour longue durée (3 semaines). Maintenance hebdomadaire requise. Communication en anglais ou italien préférée.",
    items: [
      {
        id: "item-1",
        type: "cleaning" as const,
        name: "Nettoyage Luxury Premium",
        description: "Service premium pour logements de luxe, attention particulière aux matériaux nobles et équipements haut de gamme",
        quantity: 3,
        unitPrice: 15000,
        total: 45000
      },
      {
        id: "item-2",
        type: "maintenance" as const,
        name: "Maintenance Jacuzzi & Spa",
        description: "Entretien spécialisé jacuzzi, vérification système spa, équilibrage chimique",
        quantity: 2,
        unitPrice: 12000,
        total: 24000
      },
      {
        id: "item-3",
        type: "service" as const,
        name: "Conciergerie Multilangue Premium",
        description: "Service de conciergerie premium avec assistance multilingue et recommandations personnalisées",
        quantity: 1,
        unitPrice: 8000,
        total: 8000
      }
    ]
  }
]

interface QuoteGeneratorProps {
  ownerId: string
}

export function QuoteGenerator({ ownerId }: QuoteGeneratorProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [savedQuotes, setSavedQuotes] = useState<(QuoteData & { id: string; createdAt: string })[]>([])
  const [currentMockIndex, setCurrentMockIndex] = useState(0)
  const [currentTab, setCurrentTab] = useState<string>('new')
  const quotePreviewRef = useRef<HTMLDivElement>(null)
  const [quote, setQuote] = useState<QuoteData>({
    propertyId: '',
    clientName: '',
    clientEmail: '',
    validUntil: '',
    items: [],
    subtotal: 0,
    commission: 0,
    total: 0,
    notes: ''
  })

  const isDevelopment = import.meta.env.DEV

  const getProperties = async (ownerId: string): Promise<Property[]> => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching properties:', error)
      return []
    }
  }

  const getServices = async (): Promise<Service[]> => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching services:', error)
      return []
    }
  }

  const loadSavedQuotes = useCallback(() => {
    const saved = localStorage.getItem(`quotes_${ownerId}`)
    if (saved) {
      setSavedQuotes(JSON.parse(saved))
    }
  }, [ownerId])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [propertiesData, servicesData] = await Promise.all([
        getProperties(ownerId),
        getServices()
      ])
      setProperties(propertiesData)
      setServices(servicesData)
      
      loadSavedQuotes()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [ownerId, loadSavedQuotes])

  useEffect(() => {
    loadData()
  }, [loadData])

  const calculateTotals = useCallback((items: QuoteItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const commission = subtotal * 0.2
    const total = subtotal + commission
    
    return { subtotal, commission, total }
  }, [])

  const fillMockData = useCallback(() => {
    const mockData = mockQuotes[currentMockIndex]
    const totals = calculateTotals(mockData.items)
    
    setQuote({
      propertyId: properties.length > 0 ? properties[0].id : '',
      clientName: mockData.clientName,
      clientEmail: mockData.clientEmail,
      validUntil: mockData.validUntil,
      items: mockData.items,
      notes: mockData.notes,
      ...totals
    })

    setCurrentMockIndex((prev) => {
      let newIndex = prev
      while (newIndex === prev && mockQuotes.length > 1) {
        newIndex = Math.floor(Math.random() * mockQuotes.length)
      }
      return newIndex
    })
  }, [currentMockIndex, properties, calculateTotals])

  const addQuoteItem = () => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      type: 'service',
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
    
    const newItems = [...quote.items, newItem]
    const totals = calculateTotals(newItems)
    
    setQuote(prev => ({
      ...prev,
      items: newItems,
      ...totals
    }))
  }

  const removeQuoteItem = (itemId: string) => {
    const newItems = quote.items.filter(item => item.id !== itemId)
    const totals = calculateTotals(newItems)
    
    setQuote(prev => ({
      ...prev,
      items: newItems,
      ...totals
    }))
  }

  const updateQuoteItem = (itemId: string, field: keyof QuoteItem, value: string | number) => {
    const newItems = quote.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value }
        
        if (field === 'quantity' || field === 'unitPrice') {
          const unitPriceInEuros = field === 'unitPrice' 
            ? Number(value)
            : updatedItem.unitPrice
          
          updatedItem.unitPrice = unitPriceInEuros
          updatedItem.total = Number(updatedItem.quantity) * unitPriceInEuros
        }
        
        return updatedItem
      }
      return item
    })
    
    const totals = calculateTotals(newItems)
    
    setQuote(prev => ({
      ...prev,
      items: newItems,
      ...totals
    }))
  }

  const addServiceToQuote = (service: Service) => {
    const newItem: QuoteItem = {
      id: `service-${service.id}-${Date.now()}`,
      type: 'service',
      name: service.name,
      description: service.description || '',
      quantity: 1,
      unitPrice: service.base_price, // Already in euros from database
      total: service.base_price
    }
    
    const newItems = [...quote.items, newItem]
    const totals = calculateTotals(newItems)
    
    setQuote(prev => ({
      ...prev,
      items: newItems,
      ...totals
    }))
  }

  const generatePDF = async () => {
    if (quote.items.length === 0) {
      toast.error('Veuillez ajouter au moins un service avant de générer le PDF')
      return
    }

    if (!quotePreviewRef.current) {
      toast.error('Prévisualisation non disponible. Veuillez réessayer.')
      return
    }

    try {
      setLoading(true)
      const filename = `devis-${quote.clientName ? quote.clientName.replace(/\s+/g, '-').toLowerCase() : 'client'}-${Date.now()}.pdf`
      
      await exportQuoteFromElement(quotePreviewRef.current, filename)
      
      toast.success('PDF généré avec succès et téléchargé! 📄', {
        description: `Le fichier ${filename} a été téléchargé`,
        duration: 5000
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Erreur lors de la génération du PDF', {
        description: 'Veuillez réessayer dans quelques instants',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const saveQuote = () => {
    if (!quote.clientName || !quote.clientEmail || quote.items.length === 0) {
      toast.error('Informations manquantes', {
        description: 'Veuillez remplir les informations client et ajouter au moins un service'
      })
      return
    }

    const quoteToSave = {
      ...quote,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }

    const existing = localStorage.getItem(`quotes_${ownerId}`)
    const quotes = existing ? JSON.parse(existing) : []
    quotes.push(quoteToSave)
    
    localStorage.setItem(`quotes_${ownerId}`, JSON.stringify(quotes))
    setSavedQuotes(quotes)
    
    setQuote({
      propertyId: '',
      clientName: '',
      clientEmail: '',
      validUntil: '',
      items: [],
      subtotal: 0,
      commission: 0,
      total: 0,
      notes: ''
    })
    
    toast.success('Devis sauvegardé avec succès! 💾', {
      description: `Devis pour ${quoteToSave.clientName} ajouté à vos devis sauvegardés`,
      duration: 4000
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const loadSavedQuote = (savedQuote: QuoteData & { id: string; createdAt: string }) => {
    setQuote({
      propertyId: savedQuote.propertyId,
      clientName: savedQuote.clientName,
      clientEmail: savedQuote.clientEmail,
      validUntil: savedQuote.validUntil,
      items: savedQuote.items,
      subtotal: savedQuote.subtotal,
      commission: savedQuote.commission,
      total: savedQuote.total,
      notes: savedQuote.notes,
      id: savedQuote.id
    })
    
    setCurrentTab('preview')
    
    toast.success('Devis chargé avec succès! 📄', {
      description: `Devis de ${savedQuote.clientName} chargé dans la prévisualisation`,
      duration: 3000
    })
  }

  const deleteSavedQuote = (quoteId: string) => {
    const existing = localStorage.getItem(`quotes_${ownerId}`)
    if (existing) {
      const quotes = JSON.parse(existing) as (QuoteData & { id: string; createdAt: string })[]
      const updatedQuotes = quotes.filter((q) => q.id !== quoteId)
      localStorage.setItem(`quotes_${ownerId}`, JSON.stringify(updatedQuotes))
      setSavedQuotes(updatedQuotes)
      
      toast.success('Devis supprimé avec succès! 🗑️', {
        description: 'Le devis a été retiré de vos devis sauvegardés',
        duration: 3000
      })
    }
  }

  const getDefaultValidDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
  }

  if (loading && properties.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Générateur de devis</h3>
          <p className="text-gray-600 mt-1">Créez des devis personnalisés pour vos clients</p>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nouveau devis</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Prévisualisation</span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Devis sauvegardés ({savedQuotes.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6">
          <div className="flex justify-end space-x-4 mb-6">
            <Button
              onClick={saveQuote}
              disabled={!quote.propertyId || !quote.clientName || quote.items.length === 0 || loading}
              className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#4fb8e8] hover:to-[#1e4fd4] text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <Card className="rounded-xl border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Home className="h-5 w-5 mr-2 text-blue-600" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property">Propriété</Label>
                  <select
                    id="property"
                    value={quote.propertyId}
                    onChange={(e) => setQuote(prev => ({ ...prev, propertyId: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une propriété</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="validUntil">Valide jusqu'au</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={quote.validUntil || getDefaultValidDate()}
                    onChange={(e) => setQuote(prev => ({ ...prev, validUntil: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Nom du client</Label>
                  <Input
                    id="clientName"
                    value={quote.clientName}
                    onChange={(e) => setQuote(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Nom complet du client"
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email du client</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={quote.clientEmail}
                    onChange={(e) => setQuote(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-green-600" />
                  Services et prestations
                </div>
                <Button
                  onClick={addQuoteItem}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quote.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun élément ajouté au devis</p>
                  <p className="text-sm">Cliquez sur "Ajouter" pour commencer</p>
                </div>
              ) : (
                quote.items.map((item, index) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Élément #{index + 1}</span>
                      <Button
                        onClick={() => removeQuoteItem(item.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Type</Label>
                        <select
                          value={item.type}
                          onChange={(e) => updateQuoteItem(item.id, 'type', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="service">Service</option>
                          <option value="cleaning">Nettoyage</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateQuoteItem(item.id, 'name', e.target.value)}
                          placeholder="Nom du service"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateQuoteItem(item.id, 'description', e.target.value)}
                        placeholder="Description détaillée"
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Quantité</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuoteItem(item.id, 'quantity', Number(e.target.value))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label>Prix unitaire (€)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice.toFixed(2)}
                          onChange={(e) => updateQuoteItem(item.id, 'unitPrice', Number(e.target.value))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label>Total (€)</Label>
                        <div className="text-sm font-semibold text-green-600 mt-2">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Notes additionnelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={quote.notes}
                onChange={(e) => setQuote(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Conditions particulières, modalités de paiement, garanties..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-xl border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Euro className="h-5 w-5 mr-2 text-blue-600" />
                Récapitulatif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-semibold">{formatCurrency(quote.subtotal)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  Commission PJ
                  <Percent className="h-3 w-3 ml-1" />
                  (20%)
                </span>
                <span className="font-semibold text-blue-600">{formatCurrency(quote.commission)}</span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total TTC</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Users className="h-5 w-5 mr-2 text-orange-600" />
                Services disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucun service disponible</p>
              ) : (
                services.slice(0, 5).map(service => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{service.name}</div>
                      <div className="text-xs text-gray-500">{formatCurrency(service.base_price)}</div>
                    </div>
                    <Button
                      onClick={() => addServiceToQuote(service)}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {isDevelopment && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
              <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                🧪 Dev Mode - Devis
              </div>

              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  Devis actuel: <span className="font-medium">{mockQuotes[currentMockIndex].clientName}</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillMockData}
                  className="w-full text-xs bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
                >
                  🔧 Remplir données ({currentMockIndex + 1}/{mockQuotes.length})
                </Button>

                <div className="text-xs text-gray-500">
                  Chaque clic charge le devis suivant
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {quote.items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Eye className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun aperçu disponible</h3>
                <p className="text-gray-500 text-center">
                  Ajoutez des services dans l'onglet "Nouveau devis" pour voir la prévisualisation
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col space-y-6 justify-center">
              <div className="flex justify-end items-center space-x-4">
                <Button
                  onClick={saveQuote}
                  disabled={!quote.propertyId || !quote.clientName || quote.items.length === 0 || loading}
                  variant="outline"
                  className="border-[#2c67f2] text-[#2c67f2] hover:bg-[#2c67f2] hover:text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                <Button
                  onClick={generatePDF}
                  disabled={!quote.propertyId || !quote.clientName || quote.items.length === 0 || loading}
                  className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#4fb8e8] hover:to-[#1e4fd4] text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Génération...' : 'Télécharger PDF'}
                </Button>
              </div>
              
              <div className='self-center' ref={quotePreviewRef}>
                <QuoteTemplate
                  quote={{
                    ...quote,
                    id: quote.id || Date.now().toString(),
                    createdAt: new Date().toISOString()
                  }}
                  property={properties.find(p => p.id === quote.propertyId)}
                  services={services}
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          {savedQuotes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devis sauvegardé</h3>
                <p className="text-gray-500 text-center">
                  Créez votre premier devis dans l'onglet "Nouveau devis"
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {savedQuotes.map((savedQuote) => (
                <Card key={savedQuote.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{savedQuote.clientName}</h4>
                        <p className="text-gray-600">{savedQuote.clientEmail}</p>
                        <p className="text-sm text-gray-500">
                          Créé le {new Date(savedQuote.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#2c67f2]">
                          {formatCurrency(savedQuote.total)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {savedQuote.items.length} service(s)
                        </p>
                      </div>
                    </div>
                    
                    {savedQuote.propertyId && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          <Home className="h-4 w-4 inline mr-1" />
                          {properties.find(p => p.id === savedQuote.propertyId)?.title || 'Propriété inconnue'}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-500">
                        Valide jusqu'au: {savedQuote.validUntil ? new Date(savedQuote.validUntil).toLocaleDateString('fr-FR') : 'Non défini'}
                      </div>
                      <div className="flex space-x-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le devis</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer le devis pour <strong>{savedQuote.clientName}</strong> ?
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSavedQuote(savedQuote.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          onClick={() => loadSavedQuote(savedQuote)}
                          size="sm"
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
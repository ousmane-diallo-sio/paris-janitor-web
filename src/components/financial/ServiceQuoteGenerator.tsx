import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator, Download, Send } from 'lucide-react'
import { 
  generateServiceQuote, 
  formatCurrency, 
  formatPercentage,
  type ServiceQuote 
} from '@/services/financialService'
import { supabase } from '@/lib/supabase'
import { notify, logError } from '@/lib/error-handling'

const quoteSchema = z.object({
  service_type: z.string().min(1, 'Veuillez sélectionner un service'),
  quantity: z.number().min(1, 'La quantité doit être au moins de 1').max(100),
  property_id: z.string().optional(),
})

type QuoteFormData = z.infer<typeof quoteSchema>

interface ServiceQuoteGeneratorProps {
  ownerId: string
  onQuoteGenerated?: (quote: ServiceQuote) => void
}

interface Service {
  id: string
  name: string
  category: string
  description: string | null
  base_price: number
}

export function ServiceQuoteGenerator({ ownerId, onQuoteGenerated }: ServiceQuoteGeneratorProps) {
  const [quote, setQuote] = useState<ServiceQuote | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      quantity: 1
    }
  })

  const selectedServiceType = watch('service_type')
  const quantity = watch('quantity')

  const generateQuote = useCallback(async (serviceType: string, qty: number) => {
    try {
      setLoading(true)
      setError('')
      
      const quoteData = await generateServiceQuote(serviceType, qty)
      setQuote(quoteData)
      onQuoteGenerated?.(quoteData)
      
      if (quoteData.total_amount > 0) {
        notify.success(`Devis généré: ${formatCurrency(quoteData.total_amount)}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération du devis'
      setError(errorMessage)
      logError(err, 'ServiceQuoteGenerator.generateQuote')
      notify.error(err, {
        label: 'Réessayer',
        onClick: () => generateQuote(serviceType, qty)
      })
    } finally {
      setLoading(false)
    }
  }, [onQuoteGenerated])

  useEffect(() => {
    const loadData = async () => {
      try {
        const servicesData = await supabase
          .from('services')
          .select('id, name, category, description, base_price')
          .eq('is_active', true)

        if (servicesData.data) setServices(servicesData.data)
      } catch (err) {
        logError(err, 'ServiceQuoteGenerator.loadData')
        setError('Erreur lors du chargement des données')
        notify.error('Impossible de charger la liste des services', {
          label: 'Réessayer',
          onClick: () => loadData()
        })
      }
    }

    loadData()
  }, [ownerId])

  useEffect(() => {
    if (selectedServiceType && quantity) {
      generateQuote(selectedServiceType, quantity)
    }
  }, [selectedServiceType, quantity, generateQuote])

  const onSubmit = async (data: QuoteFormData) => {
    await generateQuote(data.service_type, data.quantity)
  }

  const handleServiceChange = (value: string) => {
    setValue('service_type', value)
  }

  const selectedService = services.find(s => s.name === selectedServiceType)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Générateur de devis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service_type">Type de service</Label>
                <Select onValueChange={handleServiceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.name}>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(service.base_price / 100)} • {service.category}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.service_type && (
                  <p className="text-sm text-red-500 mt-1">{errors.service_type.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  {...register('quantity', { valueAsNumber: true })}
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
                )}
              </div>
            </div>

            {selectedService && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-900">Description du service</h4>
                <p className="text-sm text-blue-800 mt-1">
                  {selectedService.description || 'Aucune description disponible'}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {quote && (
        <Card>
          <CardHeader>
            <CardTitle>Devis généré</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quote Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Détails du service</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium">{quote.service_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantité:</span>
                      <span>{quote.quantity} {quote.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prix unitaire:</span>
                      <span>{formatCurrency(quote.base_price)}</span>
                    </div>
                    {quote.estimated_duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Durée estimée:</span>
                        <span>{quote.estimated_duration}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Calcul des coûts</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sous-total HT:</span>
                      <span>{formatCurrency(quote.total_before_tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">TVA ({formatPercentage(quote.tax_rate)}):</span>
                      <span>{formatCurrency(quote.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission PJ ({formatPercentage(quote.commission_rate)}):</span>
                      <span className="text-blue-600">{formatCurrency(quote.commission_amount)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Total TTC:</span>
                      <span className="text-lg">{formatCurrency(quote.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>Description:</strong> {quote.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Ce devis est valable 30 jours à compter de sa génération. 
                  Les prix incluent la TVA et la commission Paris Janitor.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer le devis
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger en PDF
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setQuote(null)
                    setValue('service_type', '')
                    setValue('quantity', 1)
                  }}
                >
                  Nouveau devis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}

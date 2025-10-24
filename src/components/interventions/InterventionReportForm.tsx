import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import { db } from '@/lib/database'

interface InterventionWithDetails {
  id: string
  status: string | null
  created_at: string | null
  completed_at: string | null
  provider_notes: string | null
  work_description: string | null
  materials_used: string[] | null
  provider_id: string
  service_request_id: string | null
  service_requests?: {
    id: string
    title: string | null
    description: string | null
  } | null
}

interface InterventionReportFormProps {
  intervention: InterventionWithDetails
  onReportSubmitted?: () => void
}

export function InterventionReportForm({ intervention, onReportSubmitted }: InterventionReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    work_description: intervention.work_description || '',
    provider_notes: intervention.provider_notes || '',
    materials_used: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const materialsArray = formData.materials_used
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)

      await db.interventions.update(intervention.id, {
        work_description: formData.work_description,
        provider_notes: formData.provider_notes,
        materials_used: materialsArray,
        completed_at: new Date().toISOString(),
        status: 'completed'
      })

      toast.success('Rapport d\'intervention soumis avec succès')
      onReportSubmitted?.()
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      toast.error('Erreur lors de la soumission du rapport')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isCompleted = Boolean(intervention.status === 'completed' || intervention.completed_at)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] text-white">
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6" />
            <span>Rapport d'intervention</span>
            <Badge className="ml-auto bg-white text-blue-600">
              {intervention.status || 'En attente'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Créée le {format(new Date(intervention.created_at || new Date()), 'd MMMM yyyy', { locale: fr })}
              </span>
            </div>
            {intervention.service_requests?.title && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="font-medium">{intervention.service_requests.title}</span>
              </div>
            )}
          </div>

          {intervention.service_requests?.description && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Description du service :</h4>
              <p className="text-blue-800">{intervention.service_requests.description}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="work_description">Description des travaux effectués *</Label>
              <Textarea
                id="work_description"
                value={formData.work_description}
                onChange={(e) => setFormData(prev => ({ ...prev, work_description: e.target.value }))}
                placeholder="Décrivez en détail les travaux réalisés..."
                rows={4}
                required
                disabled={isCompleted}
              />
            </div>

            <div>
              <Label htmlFor="materials_used">Matériaux utilisés (séparés par des virgules)</Label>
              <Input
                id="materials_used"
                value={formData.materials_used}
                onChange={(e) => setFormData(prev => ({ ...prev, materials_used: e.target.value }))}
                placeholder="Ex: Peinture blanche, Pinceaux, Bâche de protection..."
                disabled={isCompleted}
              />
            </div>

            <div>
              <Label htmlFor="provider_notes">Notes additionnelles</Label>
              <Textarea
                id="provider_notes"
                value={formData.provider_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, provider_notes: e.target.value }))}
                placeholder="Observations, recommandations, problèmes rencontrés..."
                rows={3}
                disabled={isCompleted}
              />
            </div>

            <div className="flex justify-end space-x-4">
              {!isCompleted && (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#2c67f2] hover:to-[#62cff4]"
                >
                  {isSubmitting ? 'Soumission...' : 'Soumettre le rapport'}
                </Button>
              )}
            </div>
          </form>

          {isCompleted && (
            <div className="mt-8 pt-6 border-t">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Intervention terminée</span>
                </div>
                {intervention.completed_at && (
                  <p className="text-sm text-green-700">
                    Terminée le {format(new Date(intervention.completed_at), 'd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-4">
                {intervention.work_description && (
                  <div>
                    <h4 className="font-medium mb-2">Travaux effectués :</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{intervention.work_description}</p>
                  </div>
                )}

                {intervention.provider_notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes du prestataire :</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{intervention.provider_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
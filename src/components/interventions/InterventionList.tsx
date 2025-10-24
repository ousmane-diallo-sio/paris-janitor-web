import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, User, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import { db } from '@/lib/database'
import { InterventionReportForm } from './InterventionReportForm'

interface Intervention {
  id: string
  status: string | null
  created_at: string | null
  completed_at: string | null
  provider_notes: string | null
  work_description: string | null
  materials_used: unknown
  provider_id: string
  service_request_id: string | null
  service_requests?: {
    id: string
    title: string | null
    description: string | null
  } | null
  profiles?: {
    full_name: string | null
    email: string
  } | null
}

interface InterventionListProps {
  propertyId?: string
  userRole: 'property_owner' | 'service_provider'
  userId?: string
}

const statusLabels: Record<string, string> = {
  scheduled: 'Planifiée',
  in_progress: 'En cours', 
  completed: 'Terminée',
  validated: 'Validée'
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  validated: 'bg-emerald-100 text-emerald-800'
}

export function InterventionList({ propertyId, userRole, userId }: InterventionListProps) {
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)

  const loadInterventions = useCallback(async () => {
    try {
      setLoading(true)
      let data: Intervention[]

      if (userRole === 'property_owner' && propertyId) {
        data = await db.interventions.getByPropertyId(propertyId)
      } else if (userRole === 'service_provider' && userId) {
        data = await db.interventions.getByProviderId(userId)
      } else {
        data = []
      }

      setInterventions(data)
    } catch (error) {
      console.error('Erreur lors du chargement des interventions:', error)
      toast.error('Erreur lors du chargement des interventions')
    } finally {
      setLoading(false)
    }
  }, [propertyId, userId, userRole])

  useEffect(() => {
    loadInterventions()
  }, [loadInterventions])

  const handleValidateIntervention = async (interventionId: string) => {
    try {
      await db.interventions.update(interventionId, { status: 'validated' })
      toast.success('Intervention validée avec succès')
      loadInterventions()
    } catch (error) {
      console.error('Erreur lors de la validation:', error)
      toast.error('Erreur lors de la validation de l\'intervention')
    }
  }

  const filteredInterventions = interventions.filter(intervention => {
    if (statusFilter === 'all') return true
    return intervention.status === statusFilter
  })

  if (selectedIntervention) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setSelectedIntervention(null)}
          className="mb-4"
        >
          ← Retour à la liste
        </Button>
        <InterventionReportForm
          intervention={{
            ...selectedIntervention,
            materials_used: selectedIntervention.materials_used as string[] | null
          }}
          onReportSubmitted={() => {
            setSelectedIntervention(null)
            loadInterventions()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {userRole === 'property_owner' ? 'Interventions sur vos biens' : 'Mes interventions'}
        </h2>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="scheduled">Planifiées</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="completed">Terminées</SelectItem>
            <SelectItem value="validated">Validées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement des interventions...</p>
        </div>
      ) : filteredInterventions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune intervention</h3>
            <p className="text-gray-600">
              {statusFilter === 'all' 
                ? 'Aucune intervention trouvée.'
                : `Aucune intervention avec le statut "${statusLabels[statusFilter] || statusFilter}".`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredInterventions.map((intervention) => (
            <Card key={intervention.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{intervention.service_requests?.title || 'Intervention'}</span>
                      <Badge className={statusColors[intervention.status || 'scheduled']}>
                        {statusLabels[intervention.status || 'scheduled']}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {intervention.created_at
                            ? format(new Date(intervention.created_at), 'd MMMM yyyy', { locale: fr })
                            : 'Date inconnue'
                          }
                        </span>
                      </div>
                      {userRole === 'property_owner' && intervention.profiles?.full_name && (
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{intervention.profiles.full_name}</span>
                        </div>
                      )}
                      {intervention.completed_at && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>
                            Terminée le {format(new Date(intervention.completed_at), 'd MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIntervention(intervention)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir détails
                    </Button>
                    
                    {userRole === 'property_owner' && 
                     intervention.status === 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => handleValidateIntervention(intervention.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Valider
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {intervention.service_requests?.description && (
                <CardContent>
                  <p className="text-gray-700 text-sm">
                    {intervention.service_requests.description}
                  </p>
                  
                  {intervention.work_description && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Travaux effectués :</h4>
                      <p className="text-sm text-gray-700">{intervention.work_description}</p>
                    </div>
                  )}
                  
                  {intervention.provider_notes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Notes du prestataire :</h4>
                      <p className="text-sm text-blue-800">{intervention.provider_notes}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
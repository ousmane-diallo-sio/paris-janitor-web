import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarDays } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

interface AvailabilityDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (start: Date, end: Date, available: boolean, reason?: string) => void
  propertyTitle: string
  initialDates?: {
    start: Date
    end: Date
    action?: 'block' | 'unblock'
  } | null
}

export function AvailabilityDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  propertyTitle,
  initialDates 
}: AvailabilityDialogProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [action, setAction] = useState<'block' | 'unblock'>('block')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialDates) {
      setStartDate(format(initialDates.start, 'yyyy-MM-dd'))
      setEndDate(format(initialDates.end, 'yyyy-MM-dd'))
      setAction(initialDates.action || 'block')
    } else {
      const today = new Date()
      const tomorrow = addDays(today, 1)
      setStartDate(format(today, 'yyyy-MM-dd'))
      setEndDate(format(tomorrow, 'yyyy-MM-dd'))
      setAction('block')
    }
  }, [initialDates, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!startDate || !endDate) return

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      alert('La date de début doit être antérieure à la date de fin')
      return
    }

    setLoading(true)
    try {
      await onConfirm(
        start, 
        end, 
        action === 'unblock', 
        action === 'block' ? reason : undefined
      )
    } finally {
      setLoading(false)
    }
  }

  const predefinedReasons = [
    'Maintenance programmée',
    'Rénovations',
    'Usage personnel',
    'Indisponibilité temporaire',
    'Période de repos'
  ]

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <span>
              {action === 'block' ? 'Bloquer des dates' : 'Débloquer des dates'}
            </span>
          </AlertDialogTitle>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-sm text-gray-600">
            Propriété: <strong>{propertyTitle}</strong>
          </div>

          {/* Action Selection */}
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Select value={action} onValueChange={(value: 'block' | 'unblock') => setAction(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Bloquer (rendre indisponible)</span>
                  </div>
                </SelectItem>
                <SelectItem value="unblock">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Débloquer (rendre disponible)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Date de début</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Date de fin</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Reason (only for blocking) */}
          {action === 'block' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Raison du blocage</Label>
              <div className="space-y-2">
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une raison prédéfinie" />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedReasons.map((predefinedReason) => (
                      <SelectItem key={predefinedReason} value={predefinedReason}>
                        {predefinedReason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  id="reason"
                  placeholder="Ou saisir une raison personnalisée..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {startDate && endDate && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <div className="font-medium mb-1">Aperçu:</div>
              <div>
                Période: {format(new Date(startDate), 'dd MMMM yyyy', { locale: fr })} - {' '}
                {format(new Date(endDate), 'dd MMMM yyyy', { locale: fr })}
              </div>
              <div className="text-gray-600">
                Action: {action === 'block' ? 'Bloquer' : 'Débloquer'}
                {action === 'block' && reason && ` (${reason})`}
              </div>
            </div>
          )}

          <AlertDialogFooter className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className={action === 'block' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>En cours...</span>
                </div>
              ) : (
                action === 'block' ? 'Bloquer les dates' : 'Débloquer les dates'
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

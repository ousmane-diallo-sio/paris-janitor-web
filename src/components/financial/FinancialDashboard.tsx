import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  FileText,
  Clock
} from 'lucide-react'
import { 
  getOwnerFinancialSummary,
  getOwnerPaymentHistory,
  getOwnerInvoices,
  formatCurrency,
  type FinancialSummary,
  type PaymentSummary,
  type InvoiceData
} from '@/services/financialService'

interface FinancialDashboardProps {
  ownerId: string
}

export function FinancialDashboard({ ownerId }: FinancialDashboardProps) {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    subscriptionStatus: 'expired',
    nextSubscriptionDue: null
  })
  const [payments, setPayments] = useState<PaymentSummary[]>([])
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadFinancialData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [summaryData, paymentsData, invoicesData] = await Promise.all([
        getOwnerFinancialSummary(ownerId),
        getOwnerPaymentHistory(ownerId, 20),
        getOwnerInvoices(ownerId)
      ])

      setSummary(summaryData)
      setPayments(paymentsData)
      setInvoices(invoicesData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données financières'
      setError(errorMessage)
      console.error('Error loading financial data:', err)
    } finally {
      setLoading(false)
    }
  }, [ownerId])

  useEffect(() => {
    loadFinancialData()
  }, [loadFinancialData])

  const getSubscriptionStatusBadge = () => {
    switch (summary.subscriptionStatus) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Actif</Badge>
      case 'expired':
        return <Badge variant="destructive">Expiré</Badge>
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Payé</Badge>
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>
      case 'refunded':
        return <Badge variant="outline">Remboursé</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Payée</Badge>
      case 'sent':
        return <Badge variant="secondary">Envoyée</Badge>
      case 'overdue':
        return <Badge variant="destructive">En retard</Badge>
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
            <Button onClick={loadFinancialData} variant="outline" className="mt-2">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Revenus totaux
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalRevenue)}
            </div>
            <p className="text-xs text-gray-500">
              Ce mois: {formatCurrency(summary.monthlyRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Dépenses totales
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <p className="text-xs text-gray-500">
              Ce mois: {formatCurrency(summary.monthlyExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bénéfice net
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netProfit)}
            </div>
            <p className="text-xs text-gray-500">
              Revenus - Dépenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Paiements en attente
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(summary.pendingPayments)}
            </div>
            <p className="text-xs text-gray-500">
              À recevoir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Statut d'abonnement</span>
            </CardTitle>
            {getSubscriptionStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {summary.subscriptionStatus === 'active' 
                  ? 'Votre abonnement annuel est actif'
                  : 'Votre abonnement a expiré'}
              </p>
              {summary.nextSubscriptionDue && (
                <p className="text-xs text-gray-500 mt-1">
                  Prochaine échéance: {new Date(summary.nextSubscriptionDue).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
            {summary.subscriptionStatus !== 'active' && (
              <Button className="bg-blue-600 hover:bg-blue-700">
                Renouveler l'abonnement
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tables */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Historique des paiements</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun paiement trouvé</p>
              ) : (
                <div className="space-y-3">
                  {payments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            payment.status === 'completed' ? 'bg-green-500' :
                            payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="font-medium">{payment.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                              {payment.related_booking && (
                                <span className="ml-2">• {payment.related_booking.property_title}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getPaymentStatusBadge(payment.status)}
                        <div className="text-right">
                          <div className={`font-medium ${
                            payment.payment_type === 'subscription' || payment.payment_type === 'service_fee' 
                              ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {payment.payment_type === 'subscription' || payment.payment_type === 'service_fee' 
                              ? '-' : '+'}{formatCurrency(payment.amount)}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {payment.payment_type.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Factures</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune facture trouvée</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{invoice.invoice_number}</p>
                            <p className="text-sm text-gray-500">
                              Émise le {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                              • Échéance: {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-sm text-gray-600">{invoice.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getInvoiceStatusBadge(invoice.status)}
                        <div className="text-right">
                          <div className="font-medium text-blue-600">
                            {formatCurrency(invoice.total_amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            TTC
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

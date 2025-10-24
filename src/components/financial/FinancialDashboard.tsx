import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  Calendar, 
  FileText, 
  Download,
  BarChart3,
  PieChart,
  Receipt
} from 'lucide-react'
import { calculateFinancialData, formatFinancialAmount, formatPercentage, type FinancialData } from '@/services/financialService'
import { supabase } from '@/lib/supabase'

interface FinancialDashboardProps {
  ownerId: string
}

export function FinancialDashboard({ ownerId }: FinancialDashboardProps) {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month')
  const [isExporting, setIsExporting] = useState(false)
  const [showForecastModal, setShowForecastModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [forecastData, setForecastData] = useState<unknown[]>([])
  const [invoiceData, setInvoiceData] = useState<unknown[]>([])
  const [loadingForecasts, setLoadingForecasts] = useState(false)
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  const loadFinancialData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const data = await calculateFinancialData(ownerId, selectedPeriod)
      setFinancialData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données financières'
      setError(errorMessage)
      console.error('Error loading financial data:', err)
    } finally {
      setLoading(false)
    }
  }, [ownerId, selectedPeriod])

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      const data = {
        period: selectedPeriod,
        date: new Date().toISOString(),
        ...financialData
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `financial-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting data:', err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!financialData) return

    try {
      setIsExporting(true)
      
      const html2pdf = (await import('html2pdf.js')).default
      const { FinancialReportTemplate } = await import('./FinancialReportTemplate')
      const React = await import('react')
      const ReactDOMServer = await import('react-dom/server')

      const reportElement = React.createElement(FinancialReportTemplate, {
        data: financialData,
        ownerId: ownerId,
        period: selectedPeriod
      })

      const htmlString = ReactDOMServer.renderToString(reportElement)

      const opt = {
        margin: 1,
        filename: `rapport-financier-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      }

      await html2pdf().set(opt).from(htmlString).save()
      
      const event = new CustomEvent('toast', {
        detail: { message: 'Rapport PDF généré avec succès !', type: 'success' }
      })
      window.dispatchEvent(event)

    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
      const event = new CustomEvent('toast', {
        detail: { message: 'Erreur lors de la génération du rapport', type: 'error' }
      })
      window.dispatchEvent(event)
    } finally {
      setIsExporting(false)
    }
  }

  const handleViewForecasts = () => {
    if (!financialData) return

    setLoadingForecasts(true)
    
    const avgMonthlyRevenue = financialData.monthlyRevenue || financialData.totalRevenue / 12
    const growthRate = financialData.revenueGrowth / 100
    
    const forecasts = []
    for (let i = 1; i <= 3; i++) {
      const projectedRevenue = avgMonthlyRevenue * Math.pow(1 + growthRate, i)
      const projectedExpenses = financialData.monthlyExpenses * Math.pow(1 + (financialData.expenseGrowth / 100), i)
      const projectedNet = projectedRevenue - projectedExpenses
      
      forecasts.push({
        month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        revenue: projectedRevenue,
        expenses: projectedExpenses,
        net: projectedNet
      })
    }

    setForecastData(forecasts)
    setLoadingForecasts(false)
    setShowForecastModal(true)
  }

  const handleViewInvoices = async () => {
    try {
      setLoadingInvoices(true)
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          total_amount,
          created_at,
          status,
          properties!inner (
            title,
            owner_id
          )
        `)
        .eq('properties.owner_id', ownerId)
        .not('total_amount', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setInvoiceData(bookings || [])
      setLoadingInvoices(false)
      setShowInvoiceModal(true)

    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error)
      setLoadingInvoices(false)
      setInvoiceData([])
      setShowInvoiceModal(true)
    }
  }

  const handleDownloadInvoice = async () => {
    if (!financialData) return

    try {
      setIsExporting(true)
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          total_amount,
          created_at,
          status,
          check_in,
          check_out,
          properties!inner (
            title,
            owner_id
          )
        `)
        .eq('properties.owner_id', ownerId)
        .not('total_amount', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      const totalAmount = (bookings || []).reduce((sum, booking) => {
        const b = booking as {total_amount?: number}
        return sum + (b.total_amount || 0)
      }, 0) / 100

      const html2pdf = (await import('html2pdf.js')).default
      const { InvoiceTemplate } = await import('./InvoiceTemplate')
      const React = await import('react')
      const ReactDOMServer = await import('react-dom/server')

      const invoiceElement = React.createElement(InvoiceTemplate, {
        bookings: bookings || [],
        ownerId: ownerId,
        period: selectedPeriod,
        totalAmount: totalAmount,
        subscriptionFee: 100,
        serviceFees: 0
      })

      const htmlString = ReactDOMServer.renderToString(invoiceElement)

      const opt = {
        margin: 1,
        filename: `facture-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      }

      await html2pdf().set(opt).from(htmlString).save()
      
      const event = new CustomEvent('toast', {
        detail: { message: 'Facture PDF générée avec succès !', type: 'success' }
      })
      window.dispatchEvent(event)

    } catch (error) {
      console.error('Erreur lors de la génération de la facture:', error)
      const event = new CustomEvent('toast', {
        detail: { message: 'Erreur lors de la génération de la facture', type: 'error' }
      })
      window.dispatchEvent(event)
    } finally {
      setIsExporting(false)
    }
  }



  useEffect(() => {
    loadFinancialData()
  }, [loadFinancialData])

  const formatCurrency = (amount: number) => {
    return formatFinancialAmount(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données financières...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="rounded-2xl border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <Button
            onClick={loadFinancialData}
            variant="outline"
            className="rounded-xl border-red-300 text-red-700 hover:bg-red-100"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!financialData) return null

  const hasData = financialData.totalRevenue > 0 || financialData.totalExpenses > 0

  if (!hasData) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Tableau de bord financier</h3>
            <p className="text-gray-600 mt-1">
              {selectedPeriod === 'month' 
                ? `Données du mois en cours (${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})`
                : `Données cumulées de l'année ${new Date().getFullYear()}`
              }
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'month' | 'year')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="month">Mois actuel</TabsTrigger>
                <TabsTrigger value="year">Année complète</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={true}
              className="rounded-lg border-gray-300 text-gray-400 cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <BarChart3 className="h-16 w-16 text-blue-400 mx-auto mb-6" />
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Aucune donnée financière disponible
              </h4>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Votre tableau de bord financier sera disponible dès que vous aurez des propriétés avec des réservations ou des demandes de service.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>📋 Ajoutez des propriétés depuis l'onglet "Tableau de bord"</p>
                <p>🏠 Attendez la validation de vos propriétés</p>
                <p>💰 Les revenus apparaîtront automatiquement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Tableau de bord financier</h3>
          <p className="text-gray-600 mt-1">Analyse détaillée de vos revenus et dépenses</p>
        </div>
        <div className="flex items-center space-x-4">
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'month' | 'year')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="month">Ce mois</TabsTrigger>
              <TabsTrigger value="year">Cette année</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || !financialData}
            className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Export...' : 'Exporter'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Revenus {selectedPeriod === 'month' ? 'du mois' : 'de l\'année'}
            </CardTitle>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Euro className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(selectedPeriod === 'month' ? financialData.monthlyRevenue : financialData.yearlyRevenue)}
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              {(financialData.revenueGrowth ?? 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={(financialData.revenueGrowth ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatPercentage(financialData.revenueGrowth ?? 0)}
              </span>
              <span className="ml-1">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Commissions PJ {selectedPeriod === 'month' ? 'du mois' : 'de l\'année'}
            </CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(selectedPeriod === 'month' ? financialData.monthlyCommissions : financialData.yearlyCommissions)}
            </div>
            <p className="text-xs text-gray-500">
              20% des revenus de location
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Dépenses {selectedPeriod === 'month' ? 'du mois' : 'de l\'année'}
            </CardTitle>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(selectedPeriod === 'month' ? financialData.monthlyExpenses : financialData.yearlyExpenses)}
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              {(financialData.expenseGrowth ?? 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              )}
              <span className={(financialData.expenseGrowth ?? 0) >= 0 ? 'text-red-600' : 'text-green-600'}>
                {formatPercentage(financialData.expenseGrowth ?? 0)}
              </span>
              <span className="ml-1">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Revenus nets {selectedPeriod === 'month' ? 'du mois' : 'de l\'année'}
            </CardTitle>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(selectedPeriod === 'month' ? financialData.monthlyNetIncome : financialData.yearlyNetIncome)}
            </div>
            <p className="text-xs text-gray-500">
              Après commissions et dépenses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="rounded-2xl bg-white border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Évolution mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {financialData.monthlyBreakdown && financialData.monthlyBreakdown.length > 0 ? (
                (() => {
                  // Filter months with data or show current month at minimum
                  const monthsWithData = financialData.monthlyBreakdown.filter(m => m.revenue > 0 || m.expenses > 0 || m.netIncome > 0)
                  const currentMonth = new Date().getMonth()
                  
                  // If no months have data, show current month with 0 values
                  const displayMonths = monthsWithData.length > 0 
                    ? monthsWithData 
                    : [financialData.monthlyBreakdown[currentMonth]]
                  
                  return displayMonths.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{month.month}</div>
                        <div className="text-sm text-gray-500">
                          Revenus: {formatCurrency(month.revenue)} • 
                          Dépenses: {formatCurrency(month.expenses)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${month.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(month.netIncome)}
                        </div>
                        <div className="text-xs text-gray-500">Net</div>
                      </div>
                    </div>
                  ))
                })()
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Aucune donnée mensuelle disponible</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Les données apparaîtront ici une fois que vous aurez des revenus enregistrés
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        <Card className="rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Rapport détaillé</h4>
            <p className="text-sm text-gray-600 mb-4">
              Générez un rapport financier complet pour la période sélectionnée
            </p>
            <Button 
              onClick={handleGenerateReport}
              disabled={isExporting || !financialData}
              className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#4fb8e8] hover:to-[#1e4fd4] text-white disabled:opacity-50"
            >
              {isExporting ? 'Génération...' : 'Générer le rapport'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 border-green-100">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Prévisions</h4>
            <p className="text-sm text-gray-600 mb-4">
              Consultez les prévisions de revenus pour les prochains mois
            </p>
            <Button 
              onClick={handleViewForecasts}
              variant="outline" 
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              Voir les prévisions
            </Button>
          </CardContent>
        </Card>

        {/* <Card className="rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border-orange-100">
          <CardContent className="p-6 text-center">
            <Receipt className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Factures</h4>
            <p className="text-sm text-gray-600 mb-4">
              Accédez à toutes vos factures et reçus de paiement
            </p>
              <Button 
                onClick={handleViewInvoices}
                variant="outline" 
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                Voir les factures
              </Button>
          </CardContent>
        </Card> */}


      </div>

      <AlertDialog open={showForecastModal} onOpenChange={setShowForecastModal}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <span>Prévisions financières</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Projections basées sur vos tendances actuelles de croissance
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            {loadingForecasts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p>Calcul des prévisions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {financialData && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Taux de croissance actuel :</strong> {financialData.revenueGrowth.toFixed(1)}% par mois
                    </p>
                  </div>
                )}
                
                {forecastData.map((forecast, index) => {
                  const f = forecast as {month: string, revenue: number, expenses: number, net: number}
                  return (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-gray-900">{f.month}</h4>
                            <div className="text-sm text-gray-600 mt-1">
                              <span>Revenus prévus: {formatCurrency(f.revenue)}</span>
                              <span className="mx-2">•</span>
                              <span>Dépenses: {formatCurrency(f.expenses)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold text-lg ${f.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(f.net)}
                            </div>
                            <div className="text-xs text-gray-500">Bénéfice net</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Ces prévisions sont indicatives et basées sur les tendances passées. 
                    Les résultats réels peuvent varier en fonction du marché et de vos actions.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <Button onClick={() => setShowForecastModal(false)}>
              Fermer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-orange-600" />
              <span>Historique des factures</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Dernières réservations et paiements reçus
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 max-h-96 overflow-y-auto">
            {loadingInvoices ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p>Chargement des factures...</p>
              </div>
            ) : invoiceData.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Aucune facture trouvée</p>
                <p className="text-sm text-gray-400 mt-1">
                  Les factures apparaîtront ici dès que vous aurez des réservations
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoiceData.map((booking) => {
                  const b = booking as {id: string, status: string, properties?: {title: string}, created_at?: string, total_amount?: number}
                  return (
                    <Card key={b.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {b.properties?.title || 'Propriété inconnue'}
                              </span>
                              <Badge 
                                className={b.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                              >
                                {b.status === 'confirmed' ? 'Confirmée' : 'En attente'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span>Réservation #{b.id.slice(0, 8)}</span>
                              <span className="mx-2">•</span>
                              <span>
                                {b.created_at 
                                  ? new Date(b.created_at).toLocaleDateString('fr-FR')
                                  : 'Date inconnue'
                                }
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-green-600">
                              {b.total_amount 
                                ? formatCurrency(b.total_amount / 100)
                                : '0,00 €'
                              }
                            </div>
                            <div className="text-xs text-gray-500">Montant total</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total des réservations :</span>
                    <span className="font-bold text-xl text-green-600">
                      {formatCurrency(
                        invoiceData.reduce((sum: number, booking) => {
                          const b = booking as {total_amount?: number}
                          return sum + (b.total_amount || 0)
                        }, 0) / 100
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
            <AlertDialogFooter>
            <div className="flex space-x-2">
              <Button 
                onClick={handleDownloadInvoice}
                disabled={isExporting}
                className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#4fb8e8] hover:to-[#1e4fd4] text-white"
              >
                {isExporting ? 'Génération...' : 'Télécharger PDF'}
              </Button>
              <Button onClick={() => setShowInvoiceModal(false)}>
                Fermer
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  )
}
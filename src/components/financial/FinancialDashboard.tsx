import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

interface FinancialDashboardProps {
  ownerId: string
}

export function FinancialDashboard({ ownerId }: FinancialDashboardProps) {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month')
  const [isExporting, setIsExporting] = useState(false)

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

  const handleGenerateReport = () => {
    alert('Fonctionnalité de génération de rapport en cours de développement. Bientôt disponible!')
  }

  const handleViewForecasts = () => {
    alert('Fonctionnalité de prévisions en cours de développement. Bientôt disponible!')
  }

  const handleViewInvoices = () => {
    alert('Fonctionnalité de gestion des factures en cours de développement. Bientôt disponible!')
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
                financialData.monthlyBreakdown.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{month.month}</div>
                      <div className="text-sm text-gray-500">
                        Revenus: {formatCurrency(month.revenue)} • 
                        Dépenses: {formatCurrency(month.expenses)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(month.netIncome)}
                      </div>
                      <div className="text-xs text-gray-500">Net</div>
                    </div>
                  </div>
                ))
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

        <Card className="rounded-2xl bg-white border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
              <PieChart className="h-5 w-5 mr-2 text-red-600" />
              Répartition des dépenses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {financialData.expenseCategories && financialData.expenseCategories.length > 0 ? (
                financialData.expenseCategories.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{category.category}</span>
                      <span className="text-sm text-gray-900">{formatCurrency(category.amount)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12">{category.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Aucune dépense enregistrée</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Les catégories de dépenses apparaîtront ici lorsque vous aurez des frais
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Rapport détaillé</h4>
            <p className="text-sm text-gray-600 mb-4">
              Générez un rapport financier complet pour la période sélectionnée
            </p>
            <Button 
              onClick={handleGenerateReport}
              className="bg-gradient-to-r from-[#62cff4] to-[#2c67f2] hover:from-[#4fb8e8] hover:to-[#1e4fd4] text-white"
            >
              Générer le rapport
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

        <Card className="rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border-orange-100">
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
        </Card>
      </div>
    </div>
  )
}
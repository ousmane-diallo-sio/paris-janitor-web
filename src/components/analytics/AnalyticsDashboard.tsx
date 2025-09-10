import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Home, 
  Calendar, 
  Euro, 
  Star,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react'
import {
  getPropertyOwnerAnalytics,
  getServiceProviderAnalytics,
  getTravelerAnalytics,
  type PropertyOwnerMetrics,
  type ServiceProviderMetrics,
  type TravelerMetrics
} from '@/services/analyticsService'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'
import { formatCurrency } from '@/services/stripeService'

interface AnalyticsDashboardProps {
  userRole: 'property_owner' | 'service_provider' | 'traveler'
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  format?: 'currency' | 'percentage' | 'number'
}

function MetricCard({ title, value, change, icon, format = 'number' }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString()
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {change !== undefined && (
          <p className={`text-xs flex items-center ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(change).toFixed(1)}% ce mois-ci
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function PropertyOwnerAnalytics({ metrics }: { metrics: PropertyOwnerMetrics }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Propriétés actives"
          value={metrics.activeProperties}
          icon={<Home />}
        />
        <MetricCard
          title="Revenus totaux"
          value={metrics.totalRevenue}
          format="currency"
          icon={<Euro />}
        />
        <MetricCard
          title="Taux d'occupation"
          value={metrics.occupationRate}
          format="percentage"
          icon={<Activity />}
        />
        <MetricCard
          title="Note moyenne"
          value={metrics.averageRating}
          icon={<Star />}
        />
      </div>

      {/* Top Performing Property */}
      {metrics.topPerformingProperty && (
        <Card>
          <CardHeader>
            <CardTitle>Propriété la plus rentable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{metrics.topPerformingProperty.title}</h4>
                <p className="text-sm text-gray-600">
                  {metrics.topPerformingProperty.bookings} réservations
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(metrics.topPerformingProperty.revenue)}
                </div>
                <p className="text-sm text-gray-600">Revenus générés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Évolution mensuelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.monthlyTrends.slice(-6).map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{trend.month}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {trend.bookings} réservations
                  </span>
                  <span className="font-medium">
                    {formatCurrency(trend.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Properties Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par propriété</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.revenueByProperty.map((property) => (
              <div key={property.propertyId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{property.propertyTitle}</h4>
                  <p className="text-sm text-gray-600">
                    {property.bookings} réservations • {property.occupationRate.toFixed(1)}% occupation
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(property.revenue)}</div>
                  <div className="flex items-center text-sm">
                    <Star className="h-3 w-3 mr-1 text-yellow-500" />
                    {property.averageRating.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ServiceProviderAnalytics({ metrics }: { metrics: ServiceProviderMetrics }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Services actifs"
          value={metrics.activeServices}
          icon={<Target />}
        />
        <MetricCard
          title="Gains totaux"
          value={metrics.totalEarnings}
          format="currency"
          icon={<Euro />}
        />
        <MetricCard
          title="Taux de réponse"
          value={metrics.responseRate}
          format="percentage"
          icon={<Activity />}
        />
        <MetricCard
          title="Note moyenne"
          value={metrics.averageRating}
          icon={<Star />}
        />
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Taux de complétion</CardTitle>
          <CardDescription>
            {metrics.completedRequests} sur {metrics.totalRequests} demandes terminées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${metrics.completionRate}%` }}
              />
            </div>
            <span className="font-medium">{metrics.completionRate.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Top Services */}
      <Card>
        <CardHeader>
          <CardTitle>Services les plus demandés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.topServices.slice(0, 5).map((service) => (
              <div key={service.serviceId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{service.serviceName}</h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{service.category}</Badge>
                    <span className="text-sm text-gray-600">
                      {service.requests} demandes
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">
                    {formatCurrency(service.earnings)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {service.completionRate.toFixed(1)}% complété
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Évolution des gains
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.monthlyTrends.slice(-6).map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{trend.month}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {trend.requests} demandes
                  </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(trend.earnings || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TravelerAnalytics({ metrics }: { metrics: TravelerMetrics }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Réservations"
          value={metrics.totalBookings}
          icon={<Calendar />}
        />
        <MetricCard
          title="Dépenses totales"
          value={metrics.totalSpent + metrics.totalServiceSpent}
          format="currency"
          icon={<Euro />}
        />
        <MetricCard
          title="Séjour moyen"
          value={`${metrics.averageStayDuration.toFixed(1)} jours`}
          icon={<Activity />}
        />
        <MetricCard
          title="Services utilisés"
          value={metrics.totalServiceRequests}
          icon={<Target />}
        />
      </div>

      {/* Favorite Destination */}
      <Card>
        <CardHeader>
          <CardTitle>Destination préférée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {metrics.favoriteDestination}
            </div>
            <p className="text-gray-600">Ville la plus visitée</p>
          </div>
        </CardContent>
      </Card>

      {/* Spending Pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Répartition des dépenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.spendingPattern.map((pattern) => (
              <div key={pattern.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    pattern.category === 'accommodation' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <span className="capitalize">
                    {pattern.category === 'accommodation' ? 'Hébergement' : 'Services'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(pattern.amount)}</div>
                  <div className="text-sm text-gray-600">{pattern.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Booking History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Historique des réservations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.bookingHistory.slice(-6).map((history, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{history.month}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {history.bookings} réservation{history.bookings > 1 ? 's' : ''}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(history.spent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AnalyticsDashboard({ userRole }: AnalyticsDashboardProps) {
  const { user } = useAuthStore()
  const [metrics, setMetrics] = useState<PropertyOwnerMetrics | ServiceProviderMetrics | TravelerMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadAnalytics = async () => {
      try {
        setIsLoading(true)
        
        let data
        switch (userRole) {
          case 'property_owner':
            data = await getPropertyOwnerAnalytics(user.id)
            break
          case 'service_provider':
            data = await getServiceProviderAnalytics(user.id)
            break
          case 'traveler':
            data = await getTravelerAnalytics(user.id)
            break
        }
        
        setMetrics(data)
      } catch (error) {
        toast.error('Erreur lors du chargement des analyses')
        console.error('Error loading analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [user, userRole])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des analyses...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune donnée disponible</h3>
          <p className="text-gray-600">
            Commencez à utiliser la plateforme pour voir vos analyses
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analyses & Performance</h2>
          <p className="text-gray-600">
            Suivez vos performances et optimisez vos résultats
          </p>
        </div>
        <Button variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {userRole === 'property_owner' && (
        <PropertyOwnerAnalytics metrics={metrics as PropertyOwnerMetrics} />
      )}
      
      {userRole === 'service_provider' && (
        <ServiceProviderAnalytics metrics={metrics as ServiceProviderMetrics} />
      )}
      
      {userRole === 'traveler' && (
        <TravelerAnalytics metrics={metrics as TravelerMetrics} />
      )}
    </div>
  )
}

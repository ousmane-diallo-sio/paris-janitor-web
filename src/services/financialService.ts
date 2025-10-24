import { supabase } from '@/lib/supabase'
import type { Property } from '@/types/database'

export interface FinancialData {
  totalRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
  totalCommissions: number
  monthlyCommissions: number
  yearlyCommissions: number
  totalExpenses: number
  monthlyExpenses: number
  yearlyExpenses: number
  netIncome: number
  monthlyNetIncome: number
  yearlyNetIncome: number
  revenueGrowth: number
  expenseGrowth: number
  topPerformingProperties: Array<{
    property: Property
    revenue: number
    commissions: number
  }>
  monthlyBreakdown: Array<{
    month: string
    revenue: number
    expenses: number
    netIncome: number
  }>
  expenseCategories: Array<{
    category: string
    amount: number
    percentage: number
  }>
}

export interface SubscriptionData {
  isActive: boolean
  amount: number
  nextPaymentDate: string | null
  status: string
}

/**
 * Calculate comprehensive financial data for property owner
 * @param ownerId - The property owner's user ID
 * @param period - The period to analyze ('month' | 'year')
 * @returns Promise containing all financial metrics
 */
export async function calculateFinancialData(ownerId: string, period: 'month' | 'year' = 'month'): Promise<FinancialData> {
  try {
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)

    if (propertiesError) throw propertiesError

    const allProperties = properties || []
    
    if (allProperties.length === 0) {
      return getEmptyFinancialData()
    }

    const propertyIds = allProperties.map(p => p.id)
    
    const now = new Date()
    const { startDate, endDate, prevStartDate, prevEndDate } = getPeriodDates(now, period)

    const [
      currentBookings,
      previousBookings,
      currentServiceRequests,
      previousServiceRequests
    ] = await Promise.all([
      getBookingsForPeriod(propertyIds, startDate, endDate),
      getBookingsForPeriod(propertyIds, prevStartDate, prevEndDate),
      getServiceRequestsForPeriod(propertyIds, startDate, endDate),
      getServiceRequestsForPeriod(propertyIds, prevStartDate, prevEndDate)
    ])

    const currentRevenue = calculateRevenueFromBookings(currentBookings)
    const previousRevenue = calculateRevenueFromBookings(previousBookings)
    const currentCommissions = calculateCommissions(currentBookings)
    
    const currentExpenses = calculateExpensesFromServiceRequests(currentServiceRequests)
    const previousExpenses = calculateExpensesFromServiceRequests(previousServiceRequests)

    const revenueGrowth = calculateGrowth(currentRevenue, previousRevenue)
    const expenseGrowth = calculateGrowth(currentExpenses, previousExpenses)

    // Always get monthly breakdown for the current year to show trends
    const monthlyBreakdown = await getMonthlyBreakdown(propertyIds, now.getFullYear())

    const expenseCategories = await getExpenseCategories(propertyIds, startDate, endDate)
    const topPerformingProperties = await getTopPerformingProperties(allProperties, startDate, endDate)

    const netIncome = currentRevenue - currentCommissions - currentExpenses

    return {
      totalRevenue: currentRevenue,
      monthlyRevenue: period === 'month' ? currentRevenue : Math.round(currentRevenue / 12),
      yearlyRevenue: period === 'year' ? currentRevenue : currentRevenue * 12,
      totalCommissions: currentCommissions,
      monthlyCommissions: period === 'month' ? currentCommissions : Math.round(currentCommissions / 12),
      yearlyCommissions: period === 'year' ? currentCommissions : currentCommissions * 12,
      totalExpenses: currentExpenses,
      monthlyExpenses: period === 'month' ? currentExpenses : Math.round(currentExpenses / 12),
      yearlyExpenses: period === 'year' ? currentExpenses : currentExpenses * 12,
      netIncome,
      monthlyNetIncome: period === 'month' ? netIncome : Math.round(netIncome / 12),
      yearlyNetIncome: period === 'year' ? netIncome : netIncome * 12,
      revenueGrowth,
      expenseGrowth,
      topPerformingProperties,
      monthlyBreakdown,
      expenseCategories
    }
  } catch (error) {
    console.error('Error calculating financial data:', error)
    throw error
  }
}

/**
 * Get subscription data for property owner
 * @param ownerId - The property owner's user ID
 * @returns Promise containing subscription information
 */
export async function getSubscriptionData(ownerId: string): Promise<SubscriptionData> {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', ownerId)
      .eq('subscription_type', 'property_owner')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!subscription) {
      return {
        isActive: false,
        amount: 100, // 100€ in euros
        nextPaymentDate: null,
        status: 'inactive'
      }
    }

    return {
      isActive: subscription.status === 'active',
      amount: subscription.amount,
      nextPaymentDate: subscription.current_period_end,
      status: subscription.status || 'inactive'
    }
  } catch (error) {
    console.error('Error getting subscription data:', error)
    throw error
  }
}

function getEmptyFinancialData(): FinancialData {
  return {
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    totalCommissions: 0,
    monthlyCommissions: 0,
    yearlyCommissions: 0,
    totalExpenses: 0,
    monthlyExpenses: 0,
    yearlyExpenses: 0,
    netIncome: 0,
    monthlyNetIncome: 0,
    yearlyNetIncome: 0,
    revenueGrowth: 0,
    expenseGrowth: 0,
    topPerformingProperties: [],
    monthlyBreakdown: [],
    expenseCategories: []
  }
}

function getPeriodDates(now: Date, period: 'month' | 'year') {
  if (period === 'month') {
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    
    return { startDate, endDate, prevStartDate, prevEndDate }
  } else {
    const startDate = new Date(now.getFullYear(), 0, 1)
    const endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    const prevStartDate = new Date(now.getFullYear() - 1, 0, 1)
    const prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
    
    return { startDate, endDate, prevStartDate, prevEndDate }
  }
}

async function getBookingsForPeriod(propertyIds: string[], startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .in('property_id', propertyIds)
    .gte('check_in', startDate.toISOString())
    .lte('check_out', endDate.toISOString())

  if (error) throw error
  return data || []
}

async function getServiceRequestsForPeriod(propertyIds: string[], startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .in('property_id', propertyIds)
    .gte('requested_date', startDate.toISOString())
    .lte('requested_date', endDate.toISOString())
    .in('status', ['completed'])

  if (error) throw error
  return data || []
}

function calculateRevenueFromBookings(bookings: unknown[]): number {
  return bookings.reduce((total: number, booking) => {
    const bookingData = booking as { total_amount?: number }
    return total + (bookingData.total_amount || 0)
  }, 0)
}

function calculateCommissions(bookings: unknown[]): number {
  return bookings.reduce((total: number, booking) => {
    const bookingData = booking as { commission_amount?: number }
    return total + (bookingData.commission_amount || 0)
  }, 0)
}

function calculateExpensesFromServiceRequests(serviceRequests: unknown[]): number {
  return serviceRequests.reduce((total: number, request) => {
    const requestData = request as { total_amount?: number }
    return total + (requestData.total_amount || 0)
  }, 0)
}

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

async function getMonthlyBreakdown(propertyIds: string[], year: number) {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ]

  const breakdown = []
  
  for (let month = 0; month < 12; month++) {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
    
    const [bookings, serviceRequests] = await Promise.all([
      getBookingsForPeriod(propertyIds, startDate, endDate),
      getServiceRequestsForPeriod(propertyIds, startDate, endDate)
    ])

    const revenue = calculateRevenueFromBookings(bookings)
    const expenses = calculateExpensesFromServiceRequests(serviceRequests)
    const commissions = calculateCommissions(bookings)
    
    breakdown.push({
      month: months[month],
      revenue: Math.round(revenue * 100) / 100, // Round euros to 2 decimal places
      expenses: Math.round(expenses * 100) / 100,
      netIncome: Math.round((revenue - commissions - expenses) * 100) / 100
    })
  }

  return breakdown
}

async function getExpenseCategories(propertyIds: string[], startDate: Date, endDate: Date) {
  const { data: serviceRequests, error } = await supabase
    .from('service_requests')
    .select(`
      total_amount,
      services:service_id (
        category
      )
    `)
    .in('property_id', propertyIds)
    .gte('requested_date', startDate.toISOString())
    .lte('requested_date', endDate.toISOString())
    .in('status', ['completed'])

  if (error) throw error

  const categoryTotals: { [key: string]: number } = {}
  let totalExpenses = 0

  serviceRequests?.forEach(request => {
    const requestData = request as { total_amount?: number; services?: { category?: string } }
    const amount = requestData.total_amount || 0
    const category = requestData.services?.category || 'other'
    
    totalExpenses += amount
    categoryTotals[category] = (categoryTotals[category] || 0) + amount
  })

  const categories = Object.entries(categoryTotals).map(([category, amount]) => ({
    category: getCategoryDisplayName(category),
    amount: Math.round(amount * 100) / 100, // Round euros to 2 decimal places
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
  }))

  return categories.sort((a, b) => b.amount - a.amount)
}

async function getTopPerformingProperties(properties: Property[], startDate: Date, endDate: Date) {
  const propertyPerformance = await Promise.all(
    properties.map(async (property) => {
      const bookings = await getBookingsForPeriod([property.id], startDate, endDate)
      const revenue = calculateRevenueFromBookings(bookings)
      const commissions = calculateCommissions(bookings)
      
      return {
        property,
        revenue: Math.round(revenue * 100) / 100, // Round euros to 2 decimal places
        commissions: Math.round(commissions * 100) / 100
      }
    })
  )

  return propertyPerformance
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
}

function getCategoryDisplayName(category: string): string {
  const categoryNames: { [key: string]: string } = {
    'cleaning': 'Nettoyage',
    'maintenance': 'Maintenance',
    'transport': 'Transport',
    'concierge': 'Conciergerie',
    'other': 'Autres'
  }
  
  return categoryNames[category] || 'Autres'
}

/**
 * Format currency amount for display
 * @param amount - Amount in euros
 * @returns Formatted string with euro symbol
 */
export function formatFinancialAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format percentage for display
 * @param value - Percentage value
 * @returns Formatted string with percentage symbol
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
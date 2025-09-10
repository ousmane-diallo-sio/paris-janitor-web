import { supabase } from '@/lib/supabase'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export interface PaymentSummary {
  id: string
  amount: number
  payment_type: 'subscription' | 'commission' | 'service_fee' | 'maintenance'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  created_at: string
  processed_at: string | null
  description: string
  related_booking?: {
    id: string
    property_title: string
    check_in: string
    check_out: string
  }
  related_service?: {
    id: string
    service_name: string
    property_title: string
  }
}

export interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  pendingPayments: number
  monthlyRevenue: number
  monthlyExpenses: number
  subscriptionStatus: 'active' | 'expired' | 'pending'
  nextSubscriptionDue: string | null
}

export interface InvoiceData {
  id: string
  invoice_number: string
  amount: number
  tax_amount: number
  total_amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  issue_date: string
  due_date: string
  payment_date: string | null
  description: string
  line_items: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
}

export interface ServiceQuote {
  service_type: string
  base_price: number
  quantity: number
  unit: string
  tax_rate: number
  commission_rate: number
  total_before_tax: number
  tax_amount: number
  commission_amount: number
  total_amount: number
  estimated_duration?: string
  description: string
}

// Get comprehensive financial summary for property owner
export async function getOwnerFinancialSummary(ownerId: string): Promise<FinancialSummary> {
  try {
    const currentDate = new Date()
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)

    // Get all payments related to owner's properties
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(
          id,
          property_id,
          properties(title)
        ),
        service_request:service_requests(
          id,
          property_id,
          service:services(name),
          properties(title)
        )
      `)
      .or(`payer_id.eq.${ownerId},payee_id.eq.${ownerId}`)
      .order('created_at', { ascending: false })

    if (paymentsError) throw paymentsError

    // Calculate totals
    let totalRevenue = 0
    let totalExpenses = 0
    let monthlyRevenue = 0
    let monthlyExpenses = 0
    let pendingPayments = 0

    payments?.forEach(payment => {
      const amount = payment.amount / 100 // Convert from cents
      const paymentDate = new Date(payment.created_at!)
      const isCurrentMonth = paymentDate >= monthStart && paymentDate <= monthEnd

      if (payment.payee_id === ownerId) {
        // Income for the owner
        totalRevenue += amount
        if (isCurrentMonth) monthlyRevenue += amount
      } else if (payment.payer_id === ownerId) {
        // Expenses for the owner
        totalExpenses += amount
        if (isCurrentMonth) monthlyExpenses += amount
      }

      if (payment.status === 'pending') {
        pendingPayments += amount
      }
    })

    // Check subscription status
    const { data: subscriptions, error: subsError } = await supabase
      .from('payments')
      .select('*')
      .eq('payer_id', ownerId)
      .eq('payment_type', 'subscription')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (subsError) throw subsError

    let subscriptionStatus: 'active' | 'expired' | 'pending' = 'expired'
    let nextSubscriptionDue: string | null = null

    if (subscriptions && subscriptions.length > 0) {
      const lastSubscription = subscriptions[0]
      const subscriptionDate = new Date(lastSubscription.created_at!)
      const expiryDate = new Date(subscriptionDate)
      expiryDate.setFullYear(expiryDate.getFullYear() + 1) // Annual subscription

      if (expiryDate > currentDate) {
        subscriptionStatus = 'active'
        nextSubscriptionDue = expiryDate.toISOString()
      }
    }

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      pendingPayments,
      monthlyRevenue,
      monthlyExpenses,
      subscriptionStatus,
      nextSubscriptionDue
    }
  } catch (error) {
    console.error('Error fetching financial summary:', error)
    throw error
  }
}

// Get detailed payment history for property owner
export async function getOwnerPaymentHistory(
  ownerId: string, 
  limit: number = 50
): Promise<PaymentSummary[]> {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(
          id,
          check_in,
          check_out,
          property_id,
          properties(title)
        ),
        service_request:service_requests(
          id,
          property_id,
          service:services(name),
          properties(title)
        )
      `)
      .or(`payer_id.eq.${ownerId},payee_id.eq.${ownerId}`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return payments?.map(payment => ({
      id: payment.id,
      amount: payment.amount / 100, // Convert from cents
      payment_type: payment.payment_type as 'subscription' | 'commission' | 'service_fee' | 'maintenance',
      status: payment.status as 'pending' | 'completed' | 'failed' | 'refunded',
      created_at: payment.created_at!,
      processed_at: payment.processed_at,
      description: getPaymentDescription(payment),
      related_booking: payment.booking ? {
        id: payment.booking.id,
        property_title: payment.booking.properties?.title || 'Propriété inconnue',
        check_in: payment.booking.check_in || '',
        check_out: payment.booking.check_out || ''
      } : undefined,
      related_service: payment.service_request ? {
        id: payment.service_request.id,
        service_name: payment.service_request.service?.name || 'Service inconnu',
        property_title: payment.service_request.properties?.title || 'Propriété inconnue'
      } : undefined
    })) || []
  } catch (error) {
    console.error('Error fetching payment history:', error)
    throw error
  }
}

// Generate real-time service quote
export async function generateServiceQuote(
  serviceType: string,
  quantity: number = 1
): Promise<ServiceQuote> {
  try {
    // Get service pricing from database
    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('name', serviceType)
      .single()

    if (error) throw error

    const basePrice = service.base_price / 100 // Convert from cents
    const taxRate = 0.20 // 20% TVA in France
    const commissionRate = 0.20 // 20% commission as per requirements

    const totalBeforeTax = basePrice * quantity
    const taxAmount = totalBeforeTax * taxRate
    const commissionAmount = totalBeforeTax * commissionRate
    const totalAmount = totalBeforeTax + taxAmount

    return {
      service_type: serviceType,
      base_price: basePrice,
      quantity,
      unit: 'unité',
      tax_rate: taxRate,
      commission_rate: commissionRate,
      total_before_tax: totalBeforeTax,
      tax_amount: taxAmount,
      commission_amount: commissionAmount,
      total_amount: totalAmount,
      estimated_duration: service.duration_minutes ? `${service.duration_minutes} minutes` : undefined,
      description: service.description || `Service ${serviceType}`
    }
  } catch (error) {
    console.error('Error generating quote:', error)
    throw error
  }
}

// Get owner's invoices
export async function getOwnerInvoices(ownerId: string): Promise<InvoiceData[]> {
  try {
    // This would typically come from a separate invoices table
    // For now, we'll generate invoices from payment data
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(
          id,
          property_id,
          properties(title)
        )
      `)
      .eq('payee_id', ownerId)
      .eq('payment_type', 'commission')
      .order('created_at', { ascending: false })

    if (error) throw error

    return payments?.map((payment, index) => {
      const amount = payment.amount / 100
      const taxAmount = amount * 0.20
      const totalAmount = amount + taxAmount

      return {
        id: payment.id,
        invoice_number: `PJ-${format(new Date(payment.created_at!), 'yyyyMM')}-${String(index + 1).padStart(3, '0')}`,
        amount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: payment.status === 'completed' ? 'paid' : 
                payment.status === 'pending' ? 'sent' : 'draft',
        issue_date: payment.created_at!,
        due_date: new Date(new Date(payment.created_at!).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_date: payment.processed_at,
        description: `Commission sur réservation - ${payment.booking?.properties?.title || 'Propriété'}`,
        line_items: [{
          description: `Commission (20%) - Réservation`,
          quantity: 1,
          unit_price: amount,
          total: amount
        }]
      }
    }) || []
  } catch (error) {
    console.error('Error fetching invoices:', error)
    throw error
  }
}

// Helper function to generate payment description
function getPaymentDescription(payment: Record<string, unknown>): string {
  const paymentType = payment.payment_type as string
  
  switch (paymentType) {
    case 'subscription':
      return 'Abonnement annuel Paris Janitor'
    case 'commission':
      return 'Commission sur réservation'
    case 'service_fee':
      return 'Frais de service'
    case 'maintenance':
      return 'Frais de maintenance'
    default:
      return 'Paiement'
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

// Format percentage
export function formatPercentage(rate: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(rate)
}

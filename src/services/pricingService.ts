import type { 
  ServiceWithProvider, 
  PricingCalculation
} from '@/types/services'
import { COMMISSION_RATE, VIP_DISCOUNT_RATE } from '@/types/services'
import type { Service } from '@/types/database'

/**
 * Calculate service pricing following AGENTS.md specifications
 * - 20% commission on all services
 * - VIP travelers get 10% discount
 * - Distance-based pricing for taxi-like services
 * - All amounts in EUR (euros)
 */
export class ServicePricingCalculator {
  private static readonly COMMISSION_RATE = COMMISSION_RATE
  private static readonly VIP_DISCOUNT_RATE = VIP_DISCOUNT_RATE

  /**
   * Calculate total price for a service request
   */
  static calculatePrice(
    service: Service | ServiceWithProvider,
    options: {
      quantity?: number
      distance?: number
      duration?: number
      isVipTraveler?: boolean
      requestedDate?: Date
    } = {}
  ): PricingCalculation {
    const {
      quantity = 1,
      distance = 0,
      duration = service.duration_minutes || 60,
      isVipTraveler = false
    } = options

    let basePrice = service.base_price
    const breakdown: PricingCalculation['breakdown'] = []

    // Calculate base price based on price type
    switch (service.price_type) {
      case 'fixed': {
        basePrice = service.base_price * quantity
        breakdown.push({
          label: `${service.name} × ${quantity}`,
          amount: basePrice
        })
        break
      }

      case 'hourly': {
        const hours = Math.max(duration / 60, 0.5) // Minimum 30 minutes
        basePrice = service.base_price * hours * quantity
        breakdown.push({
          label: `${service.name} - ${hours.toFixed(1)}h × ${quantity}`,
          amount: basePrice
        })
        break
      }

      case 'distance': {
        basePrice = service.base_price * Math.max(distance, 1) // Minimum 1km
        breakdown.push({
          label: `${service.name} - ${distance}km`,
          amount: basePrice
        })
        break
      }

      case 'variable': {
        // For variable pricing, use base price as starting point
        // Additional logic can be implemented based on specific service requirements
        basePrice = service.base_price * quantity
        breakdown.push({
          label: `${service.name} (tarif variable) × ${quantity}`,
          amount: basePrice
        })
        break
      }

      default: {
        basePrice = service.base_price * quantity
        breakdown.push({
          label: `${service.name} × ${quantity}`,
          amount: basePrice
        })
      }
    }

    // Apply VIP discount if applicable
    let vipDiscount = 0
    if (isVipTraveler) {
      vipDiscount = basePrice * this.VIP_DISCOUNT_RATE
      breakdown.push({
        label: 'Réduction VIP (-10%)',
        amount: -vipDiscount
      })
    }

    const subtotal = basePrice - vipDiscount
    
    // Calculate commission (20% as per AGENTS.md)
    const commission = subtotal * this.COMMISSION_RATE
    breakdown.push({
      label: 'Frais de service (20%)',
      amount: commission
    })

    const total = subtotal + commission

    return {
      basePrice,
      distance,
      duration,
      quantity,
      commission,
      vipDiscount,
      total: Math.round(total * 100) / 100, // Round to 2 decimal places
      breakdown
    }
  }

  /**
   * Calculate pricing for multiple services (batch calculation)
   */
  static calculateBatchPrice(
    services: Array<{
      service: Service | ServiceWithProvider
      options: {
        quantity?: number
        distance?: number
        duration?: number
      }
    }>,
    isVipTraveler = false
  ): PricingCalculation {
    const calculations = services.map(({ service, options }) =>
      this.calculatePrice(service, { ...options, isVipTraveler })
    )

    const totalBasePrice = calculations.reduce((sum, calc) => sum + calc.basePrice, 0)
    const totalCommission = calculations.reduce((sum, calc) => sum + calc.commission, 0)
    const totalVipDiscount = calculations.reduce((sum, calc) => sum + (calc.vipDiscount || 0), 0)
    const total = calculations.reduce((sum, calc) => sum + calc.total, 0)

    // Combine all breakdowns
    const breakdown: PricingCalculation['breakdown'] = []
    calculations.forEach((calc, index) => {
      const serviceName = services[index].service.name
      breakdown.push({
        label: serviceName,
        amount: calc.basePrice
      })
    })

    if (totalVipDiscount > 0) {
      breakdown.push({
        label: 'Réduction VIP (-10%)',
        amount: -totalVipDiscount
      })
    }

    breakdown.push({
      label: 'Frais de service (20%)',
      amount: totalCommission
    })

    return {
      basePrice: totalBasePrice,
      commission: totalCommission,
      vipDiscount: totalVipDiscount,
      total: Math.round(total * 100) / 100,
      breakdown
    }
  }

  /**
   * Get minimum price for a service (used for filtering)
   */
  static getMinimumPrice(service: Service): number {
    switch (service.price_type) {
      case 'hourly':
        return service.base_price * 0.5 // 30 minutes minimum
      case 'distance':
        return service.base_price * 1 // 1km minimum
      default:
        return service.base_price
    }
  }

  /**
   * Format price for display (following European format)
   */
  static formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  /**
   * Get price display string for service cards
   */
  static getPriceDisplayString(service: Service): string {
    const basePrice = this.formatPrice(service.base_price)
    
    switch (service.price_type) {
      case 'hourly':
        return `${basePrice}/heure`
      case 'distance':
        return `${basePrice}/km`
      case 'variable':
        return `À partir de ${basePrice}`
      default:
        return basePrice
    }
  }

  /**
   * Calculate estimated total for service card display
   */
  static getEstimatedTotal(
    service: Service,
    estimatedUsage: {
      quantity?: number
      hours?: number
      distance?: number
    } = {}
  ): string {
    const { quantity = 1, hours = 1, distance = 5 } = estimatedUsage
    
    let estimatedOptions: {
      quantity: number
      duration?: number
      distance?: number
    } = { quantity }
    
    switch (service.price_type) {
      case 'hourly':
        estimatedOptions = { ...estimatedOptions, duration: hours * 60 }
        break
      case 'distance':
        estimatedOptions = { ...estimatedOptions, distance }
        break
    }

    const pricing = this.calculatePrice(service, estimatedOptions)
    return this.formatPrice(pricing.total)
  }
}
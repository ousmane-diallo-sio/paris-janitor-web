import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { envConfig } from '@/lib/env-config'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(envConfig.stripe.publishableKey)
  }
  return stripePromise
}

export interface PaymentResult {
  success: boolean
  paymentMethod?: import('@stripe/stripe-js').PaymentMethod
  error?: string
}

export const processPayment = async (
  stripe: Stripe,
  cardElement: import('@stripe/stripe-js').StripeCardElement,
  amount: number,
  customerInfo: {
    name: string
    email: string
  }
): Promise<PaymentResult> => {
  try {
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: customerInfo.name,
        email: customerInfo.email,
      },
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    console.log('💳 Stripe sandbox payment processed:', {
      amount: amount,
      currency: 'EUR',
      paymentMethod: paymentMethod.id,
      customer: customerInfo
    })

    return {
      success: true,
      paymentMethod: paymentMethod
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed'
    }
  }
}
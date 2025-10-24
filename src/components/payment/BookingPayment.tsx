import { useState } from 'react'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { getStripe, processPayment } from '@/services/stripeService'
import { toast } from 'sonner'
import { formatEuros } from '@/lib/utils'

interface BookingPaymentProps {
  booking: {
    id: string
    total_amount: number
    guest_email: string
    guest_name: string
  }
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
}

function PaymentForm({ booking, onPaymentSuccess, onPaymentError }: BookingPaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      toast.error('Stripe is not loaded yet. Please try again.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      toast.error('Card element not found. Please refresh the page.')
      return
    }

    setIsProcessing(true)

    try {
      const result = await processPayment(stripe, cardElement, booking.total_amount, {
        name: booking.guest_name,
        email: booking.guest_email,
      })

      if (result.success && result.paymentMethod) {
        const mockPaymentIntentId = `pi_sandbox_${result.paymentMethod.id}_${Date.now()}`
        onPaymentSuccess(mockPaymentIntentId)
        toast.success('Payment processed successfully! (Sandbox mode)')
      } else {
        throw new Error(result.error || 'Payment failed')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      onPaymentError(errorMessage)
      toast.error(`Payment failed: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 border rounded-lg">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total Amount:</span>
            <span className="font-semibold">{formatEuros(booking.total_amount)}</span>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || isProcessing}
          >
            {isProcessing ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processing Payment...
              </>
            ) : (
              `Pay ${formatEuros(booking.total_amount)} (Sandbox)`
            )}
          </Button>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">💡 Simple Stripe Integration:</p>
            <p className="text-xs text-blue-600 mt-1">
              This uses Stripe Elements for secure card collection. Perfect for development and demos!
            </p>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            🧪 Sandbox mode: Use test card 4242424242424242 for testing. Your payment is secured by Stripe.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

export function BookingPayment(props: BookingPaymentProps) {
  const stripePromise = getStripe()

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}
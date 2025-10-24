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
  onPaymentError?: (error: string) => void
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
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    setPaymentError(null)

    if (!stripe || !elements) {
      setPaymentError('Stripe is not loaded yet. Please try again.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setPaymentError('Card element not found. Please refresh the page.')
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
      setPaymentError(errorMessage)
      setRetryCount(prev => prev + 1)
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
          
          {paymentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
                  <div className="mt-1 text-sm text-red-700">
                    {paymentError}
                    {retryCount > 0 && (
                      <span className="block mt-1 text-xs">
                        Attempt {retryCount} of 3
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() =>  setPaymentError(null)}
                      className="text-sm text-red-600 hover:text-red-500 underline"
                    >
                      Try again
                    </button>
                    {retryCount >= 3 && (
                      <span className="ml-3 text-xs text-red-500">
                        Maximum attempts reached. Please contact support if the problem persists.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total Amount:</span>
            <span className="font-semibold">{formatEuros(booking.total_amount)}</span>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={!stripe || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                `Pay ${formatEuros(booking.total_amount)}`
              )}
            </Button>
          </div>
                    
          <p className="text-xs text-gray-500 text-center">
            Paiement sécurisé par Stripe. Utilisez la carte de test 4242 4242 4242 4242 pour les tests.
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
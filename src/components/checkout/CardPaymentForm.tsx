'use client'
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
)

const appearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#b08d57',
    colorBackground: '#ffffff',
    colorText: '#1a1713',
    colorDanger: '#df1b41',
    fontFamily: '"Jost", system-ui, sans-serif',
    borderRadius: '2px',
    spacingUnit: '5px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e9dcc6',
      boxShadow: 'none',
    },
    '.Input:focus': {
      border: '1px solid #b08d57',
      boxShadow: 'none',
      outline: 'none',
    },
    '.Label': {
      color: '#1a1713',
      fontWeight: '500',
      fontSize: '12px',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  },
}

interface CardFormProps {
  email: string
  onSuccess: (orderCode: string) => void
  onError: (msg: string) => void
}

function CardFormInner({ email, onSuccess, onError }: CardFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [localError, setLocalError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setLocalError('')

    const returnUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/api/stripe/confirm-intent`
        : '/api/stripe/confirm-intent'

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: { email },
        },
      },
    })

    if (stripeError) {
      const msg = stripeError.message ?? 'Payment failed. Please try again.'
      setLocalError(msg)
      onError(msg)
      setProcessing(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        const res = await fetch('/api/stripe/confirm-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        })
        const data = await res.json()
        if (res.ok) {
          onSuccess(data.orderCode)
        } else {
          const msg = data.error ?? 'Payment succeeded but order creation failed. Please contact us.'
          setLocalError(msg)
          onError(msg)
        }
      } catch {
        const msg = 'Network error after payment. Please contact us with your payment reference.'
        setLocalError(msg)
        onError(msg)
      }
    }

    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
          fields: {
            billingDetails: {
              email: 'never',
            },
          },
        }}
      />

      {localError && (
        <div className="flash-error">{localError}</div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing…' : 'Confirm Payment'}
      </button>
    </form>
  )
}

interface Props {
  clientSecret: string
  email: string
  onSuccess: (orderCode: string) => void
  onError?: (msg: string) => void
  onCancel: () => void
}

export function CardPaymentForm({ clientSecret, email, onSuccess, onError, onCancel }: Props) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-xl text-stone">Card Details</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-sans text-stone-pale hover:text-stone transition-colors uppercase tracking-widest"
        >
          ← Change payment
        </button>
      </div>

      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance }}
      >
        <CardFormInner email={email} onSuccess={onSuccess} onError={onError ?? (() => {})} />
      </Elements>
    </div>
  )
}

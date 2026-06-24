'use client'
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'

interface FormData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postcode: string
  country: string
  notes: string
}

interface Props {
  formData: FormData
  validate: () => string | null
  onSuccess: (orderCode: string) => void
  onError: (msg: string) => void
}

function PayPalButtonsWrapper({ formData, validate, onSuccess, onError }: Props) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer()
  const isCapturing = { current: false }

  if (isPending) {
    return <div className="w-full h-12 bg-beige animate-pulse rounded" />
  }

  if (isRejected) {
    return (
      <p className="text-sm font-sans text-red-600 text-center py-3">
        Failed to load PayPal. Please check your connection or try a different browser.
      </p>
    )
  }

  return (
    <PayPalButtons
      style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
      forceReRender={[formData]}
      createOrder={async () => {
        const err = validate()
        if (err) {
          onError(err)
          return Promise.reject(new Error(err))
        }
        const res = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json() as { orderId?: string; error?: string }
        if (!res.ok) {
          onError(data.error ?? 'Could not start PayPal payment.')
          return Promise.reject(new Error(data.error))
        }
        return data.orderId!
      }}
      onApprove={async (data) => {
        if (isCapturing.current) return
        isCapturing.current = true
        try {
          const res = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          })
          const result = await res.json() as { orderCode?: string; error?: string }
          if (!res.ok) {
            onError(result.error ?? 'Payment capture failed.')
            return
          }
          onSuccess(result.orderCode!)
        } finally {
          isCapturing.current = false
        }
      }}
      onError={() => onError('PayPal payment failed. Please try again.')}
    />
  )
}

export function PayPalPayment({ formData, validate, onSuccess, onError }: Props) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ''

  if (!clientId) {
    return <p className="text-sm font-sans text-red-600">PayPal is not configured. Please contact support.</p>
  }

  return (
    <PayPalScriptProvider options={{ clientId, currency: 'EUR', intent: 'capture' }}>
      <PayPalButtonsWrapper
        formData={formData}
        validate={validate}
        onSuccess={onSuccess}
        onError={onError}
      />
    </PayPalScriptProvider>
  )
}

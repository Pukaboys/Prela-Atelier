import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Checkout now accepts Visa and Mastercard card payments only.' },
    { status: 410 },
  )
}

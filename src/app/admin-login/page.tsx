'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const username = (form.elements.namedItem('username') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        router.push('/admin')
        router.refresh()
        return
      }

      const data = await res.json()

      if (res.status === 429) {
        setError(data.error ?? 'Too many attempts. Please wait before trying again.')
      } else {
        setError(data.error ?? 'Invalid credentials')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone flex items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-8 left-8 w-24 h-24 border-t border-l border-gold/15 pointer-events-none" />
      <div className="absolute top-8 right-8 w-24 h-24 border-t border-r border-gold/15 pointer-events-none" />
      <div className="absolute bottom-8 left-8 w-24 h-24 border-b border-l border-gold/15 pointer-events-none" />
      <div className="absolute bottom-8 right-8 w-24 h-24 border-b border-r border-gold/15 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block">
            <p className="font-serif text-3xl tracking-[0.25em] text-cream hover:text-gold transition-colors">
              PRELA
            </p>
          </Link>
          <p className="text-[10px] tracking-widest uppercase text-gold font-sans mt-1">
            Admin Panel
          </p>
          <div className="w-8 h-px bg-gold/40 mx-auto mt-4" />
        </div>

        {/* Card */}
        <div className="bg-cream border border-beige/20 shadow-luxury p-10">
          <h1 className="font-serif text-2xl text-stone text-center mb-8">
            Sign In
          </h1>

          {error && (
            <div className="flash-error mb-6" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                name="username"
                required
                autoComplete="username"
                className="form-input"
                placeholder="admin"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-cream/40 font-sans mt-6">
          <Link href="/" className="hover:text-gold transition-colors">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  )
}

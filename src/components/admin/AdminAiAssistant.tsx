'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
  actions?: Array<{
    type: string
    label: string
    href: string
    id: number | null
    code: string | null
  }>
  suggestions?: string[]
}

const STARTERS = [
  'Which orders need attention today?',
  'Find recent custom enquiries',
  'Which products should I restock?',
]

export function AdminAiAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Ask me about orders, products, enquiries, inventory, revenue, or decisions. I can also open the matching admin view.',
    suggestions: STARTERS,
  }])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function ask(nextInput = input) {
    const question = nextInput.trim()
    if (!question || loading) return

    const nextMessages: Message[] = [...messages, { role: 'user', content: question }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          history: nextMessages.slice(-8).map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.error ?? 'I could not answer right now.',
        }])
        return
      }

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.answer,
        actions: data.actions ?? [],
        suggestions: data.suggestions ?? [],
      }])
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Network error. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  function openAction(href: string) {
    window.dispatchEvent(new CustomEvent('prela-admin-open', { detail: { href } }))
    router.push(href)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-[70] border border-gold bg-stone text-cream px-4 py-3 shadow-xl font-sans text-xs uppercase tracking-[0.18em] hover:bg-gold transition-colors"
      >
        AI Assistant
      </button>

      {open ? (
        <div className="fixed bottom-20 right-5 z-[70] w-[calc(100vw-2.5rem)] max-w-md bg-white border border-beige shadow-2xl">
          <div className="flex items-center justify-between border-b border-beige px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-gold font-sans">Admin AI</p>
              <h2 className="font-serif text-xl text-stone">Prela Assistant</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-stone-pale hover:text-stone text-xl leading-none"
            >
              x
            </button>
          </div>

          <div className="max-h-[52vh] overflow-y-auto px-5 py-4 space-y-4 bg-cream/40">
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block max-w-[92%] border px-4 py-3 text-sm font-sans leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-stone text-cream border-stone'
                    : 'bg-white text-stone-mid border-beige'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.actions && message.actions.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2 justify-start">
                    {message.actions.map((action, actionIndex) => (
                      <button
                        key={`${action.href}-${actionIndex}`}
                        type="button"
                        onClick={() => openAction(action.href)}
                        className="border border-gold/40 bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-gold font-sans hover:bg-gold hover:text-white"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                {message.suggestions && message.suggestions.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2 justify-start">
                    {message.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => ask(suggestion)}
                        className="border border-beige bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-stone-mid font-sans hover:border-gold hover:text-gold"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? (
              <p className="text-xs font-sans uppercase tracking-[0.2em] text-stone-pale">Thinking...</p>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              ask()
            }}
            className="border-t border-beige p-4"
          >
            <textarea
              className="form-textarea text-sm"
              rows={3}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask: find Jeorgen order, analyze low stock, suggest next decisions..."
            />
            <button type="submit" disabled={loading || !input.trim()} className="btn-primary w-full mt-3 text-xs disabled:opacity-60">
              {loading ? 'Thinking...' : 'Ask AI'}
            </button>
          </form>
        </div>
      ) : null}
    </>
  )
}

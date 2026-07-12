'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { formatPrice, type CurrencyFormatOptions } from '@/lib/helpers'
import {
  PRODUCTION_PRIORITIES,
  PRODUCTION_STAGES,
  PRODUCTION_PRIORITY_LABELS,
  PRODUCTION_STAGE_LABELS,
  type ProductionManagementSummary,
  type ProductionPriority,
  type ProductionStage,
  getProductionStageIndex,
} from '@/lib/production-workflow'

type OrderItem = {
  id: number
  name: string
  quantity: number
  priceEur: number
  subtotal: number
}

type Order = {
  id: number
  orderCode: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  address: string
  city: string
  postcode: string
  country: string
  subtotal: number
  shipping: number
  total: number
  status: string
  productionStage: ProductionStage
  productionPriority: ProductionPriority
  production: ProductionManagementSummary
  notes: string | null
  createdAt: string
  items: OrderItem[]
}

const ALL_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const
type Status = typeof ALL_STATUSES[number]

const STATUS_COLORS: Record<Status, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
}

const STATUS_LABELS: Record<Status, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Trash',
}

function ProductionProgressBar({ stage }: { stage: ProductionStage }) {
  const currentStageIndex = getProductionStageIndex(stage)

  return (
    <div className="space-y-4">
      <div className="h-2 bg-beige overflow-hidden">
        <div
          className="h-full bg-gold transition-all duration-300"
          style={{ width: `${((currentStageIndex + 1) / PRODUCTION_STAGES.length) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
        {PRODUCTION_STAGES.map((item, index) => {
          const isComplete = index <= currentStageIndex

          return (
            <div
              key={item}
              className={`border px-3 py-4 text-center min-h-[112px] flex flex-col items-center justify-center ${
                isComplete ? 'border-gold bg-gold/5' : 'border-beige bg-white'
              }`}
            >
              <div
                className={`w-7 h-7 mx-auto rounded-full border text-xs font-sans flex items-center justify-center ${
                  isComplete ? 'border-gold bg-gold text-white' : 'border-beige text-stone-pale'
                }`}
              >
                {isComplete ? 'OK' : index + 1}
              </div>
              <p
                className={`mt-3 text-[10px] sm:text-[11px] leading-relaxed font-sans uppercase tracking-[0.14em] whitespace-normal break-words ${
                  isComplete ? 'text-stone' : 'text-stone-pale'
                }`}
              >
                {PRODUCTION_STAGE_LABELS[item]}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function ProductionLoadPanel({ orders }: { orders: Order[] }) {
  const activeOrders = orders.filter((order) => order.status !== 'cancelled')

  return (
    <div className="bg-white border border-beige p-5 mb-6">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">Production Load</p>
          <h2 className="font-serif text-xl text-stone mt-1">Stage Capacity Overview</h2>
        </div>
        <p className="text-sm font-sans text-stone-mid">{activeOrders.length} active orders</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
        {PRODUCTION_STAGES.map((stage) => {
          const stageOrders = activeOrders.filter((order) => order.productionStage === stage)
          const delayed = stageOrders.filter((order) => order.production.isDelayed).length
          const urgent = stageOrders.filter((order) => order.production.isUrgent).length

          return (
            <div
              key={stage}
              className={`border p-4 ${
                delayed > 0 ? 'border-red-200 bg-red-50' : urgent > 0 ? 'border-amber-200 bg-amber-50' : 'border-beige bg-cream'
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-pale font-sans">
                {PRODUCTION_STAGE_LABELS[stage]}
              </p>
              <p className="font-serif text-3xl text-stone mt-2">{stageOrders.length}</p>
              <p className="text-xs font-sans text-stone-mid mt-1">
                {urgent} urgent | {delayed} delayed
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProductionTimeline({ production }: { production: ProductionManagementSummary }) {
  return (
    <div className="space-y-3">
      {production.timeline.map((item, index) => (
        <div
          key={item.stage}
          className={`border px-4 py-4 ${
            item.delayed
              ? 'border-red-200 bg-red-50'
              : item.status === 'current'
                ? 'border-gold bg-gold/5'
                : item.status === 'complete'
                  ? 'border-beige bg-cream'
                  : 'border-beige bg-white'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans border shrink-0 ${
                  item.status === 'complete'
                    ? 'bg-gold border-gold text-cream'
                    : item.status === 'current'
                      ? 'bg-stone border-stone text-cream'
                      : 'bg-white border-beige text-stone-pale'
                }`}
              >
                {item.status === 'complete' ? 'OK' : index + 1}
              </div>
              <div>
                <p className="font-serif text-lg text-stone">{item.label}</p>
                <p className="text-xs font-sans text-stone-mid mt-1">
                  Estimate: {item.estimatedDays} day{item.estimatedDays === 1 ? '' : 's'}
                  {item.dueAt ? ` | Due ${formatDateTime(item.dueAt)}` : ''}
                </p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs font-sans uppercase tracking-[0.18em] text-stone-pale">
                {item.status}
              </p>
              {item.delayed ? (
                <p className="text-xs font-sans text-red-700 mt-1">
                  Delayed by {item.delayDays} day{item.delayDays === 1 ? '' : 's'}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-xs font-sans text-stone-mid">
            <p>Started: {formatDateTime(item.startedAt)}</p>
            <p>Completed: {formatDateTime(item.completedAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filterStatus, setFilterStatus] = useState<Status | ''>('')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyFormatOptions>()

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/orders')
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/settings/currency')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setCurrencyOptions(data)
      })
      .catch(() => {
        // Fall back to EUR formatting if public currency settings are unavailable.
      })
  }, [])

  async function resendInvoice(id: number) {
    setResending(true)
    setResendMsg(null)
    const res = await fetch(`/api/admin/orders/${id}/resend-invoice`, { method: 'POST' })
    setResendMsg(res.ok ? 'Invoice sent' : 'Failed to send')
    setResending(false)
    setTimeout(() => setResendMsg(null), 3000)
  }

  async function patchOrder(
    id: number,
    payload: {
      status?: Status
      productionStage?: ProductionStage
      productionPriority?: ProductionPriority
    },
  ) {
    setUpdating(true)
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const updated = await res.json()
      setOrders((prev) =>
        prev.map((order) =>
          order.id === id
            ? {
                ...order,
                ...(updated.status ? { status: updated.status } : {}),
                ...(updated.productionStage ? { productionStage: updated.productionStage } : {}),
                ...(updated.productionPriority ? { productionPriority: updated.productionPriority } : {}),
                ...(updated.production ? { production: updated.production } : {}),
                ...(Object.prototype.hasOwnProperty.call(updated, 'notes') ? { notes: updated.notes } : {}),
              }
            : order,
        ),
      )
      setSelectedOrder((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              ...(updated.status ? { status: updated.status } : {}),
              ...(updated.productionStage ? { productionStage: updated.productionStage } : {}),
              ...(updated.productionPriority ? { productionPriority: updated.productionPriority } : {}),
              ...(updated.production ? { production: updated.production } : {}),
              ...(Object.prototype.hasOwnProperty.call(updated, 'notes') ? { notes: updated.notes } : {}),
            }
          : prev,
      )
    }

    setUpdating(false)
  }

  const q = search.toLowerCase()
  const money = (value: number) => formatPrice(value, currencyOptions)
  const delayedOrders = useMemo(
    () => orders.filter((order) => order.production.isDelayed && order.status !== 'delivered' && order.status !== 'cancelled'),
    [orders],
  )
  const filtered = orders.filter((order) =>
    (!filterStatus || order.status === filterStatus) &&
    (!q ||
      order.orderCode.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerEmail.toLowerCase().includes(q))
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-stone">Orders</h1>
          <p className="text-stone-mid text-sm font-sans mt-1">
            {orders.length} order{orders.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search"
            className="form-input text-sm w-56"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-select w-auto text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Status | '')}
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ProductionLoadPanel orders={orders} />

      {delayedOrders.length > 0 ? (
        <div className="border border-red-200 bg-red-50 px-5 py-4 mb-6">
          <p className="text-xs font-sans uppercase tracking-[0.22em] text-red-700">
            {delayedOrders.length} delayed production order{delayedOrders.length === 1 ? '' : 's'}
          </p>
          <p className="text-sm font-sans text-red-700 mt-1">
            Review urgent capacity or move blocked orders to the next production stage.
          </p>
        </div>
      ) : null}

      {loading ? (
        <p className="text-stone-mid font-sans text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-beige p-12 text-center">
          <p className="font-sans text-stone-mid text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="bg-white border border-beige overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Production</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className={order.production.isDelayed ? 'bg-red-50/70' : order.production.isUrgent ? 'bg-amber-50/70' : ''}
                  >
                    <td className="font-mono text-xs text-gold">{order.orderCode}</td>
                    <td className="font-sans text-sm text-stone">{order.customerName}</td>
                    <td className="font-sans text-xs text-stone-mid">{order.customerEmail}</td>
                    <td className="font-sans text-sm">{money(order.total)}</td>
                    <td>
                      <span className={STATUS_COLORS[order.status as Status] ?? 'badge'}>
                        {STATUS_LABELS[order.status as Status] ?? order.status}
                      </span>
                    </td>
                    <td className="text-xs font-sans uppercase tracking-[0.16em] text-stone-mid">
                      <div className="flex flex-col gap-1">
                        <span>{order.productionStage}</span>
                        {order.production.isDelayed ? (
                          <span className="text-red-700 normal-case tracking-normal">
                            Delayed {order.production.delayDays}d
                          </span>
                        ) : order.production.isUrgent ? (
                          <span className="text-amber-700 normal-case tracking-normal">Urgent</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="text-xs text-stone-mid">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs text-gold hover:text-gold-dark font-sans uppercase tracking-wider"
                      >
                        View
                      </button>
                      <a
                        href={`/api/admin/invoices/${order.orderCode}`}
                        target="_blank"
                        className="text-xs text-stone-mid hover:text-stone font-sans uppercase tracking-wider"
                      >
                        Invoice
                      </a>
                      <a
                        href={`/api/admin/invoices/${order.orderCode}?download=1`}
                        className="text-xs text-stone-mid hover:text-stone font-sans uppercase tracking-wider"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone/70 px-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-beige shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-beige">
              <div>
                <h2 className="font-serif text-xl text-stone">Order {selectedOrder.orderCode}</h2>
                <p className="font-sans text-xs text-stone-mid mt-0.5">
                  {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/api/admin/invoices/${selectedOrder.orderCode}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest px-3 py-1.5 border border-beige text-stone-mid hover:border-stone hover:text-stone transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Invoice
                </a>
                <a
                  href={`/api/admin/invoices/${selectedOrder.orderCode}?download=1`}
                  className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest px-3 py-1.5 border border-beige text-stone-mid hover:border-stone hover:text-stone transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </a>
                <button
                  onClick={() => resendInvoice(selectedOrder.id)}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest px-3 py-1.5 border border-gold text-gold hover:bg-gold hover:text-white transition-colors disabled:opacity-50"
                >
                  {resendMsg ?? (resending ? 'Sending...' : 'Resend Invoice')}
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null)
                    setResendMsg(null)
                  }}
                  className="text-stone-pale hover:text-stone text-xl leading-none"
                >
                  x
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="form-label mb-3">Customer Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm font-sans">
                  <div><span className="text-stone-pale">Name</span><br /><span className="text-stone">{selectedOrder.customerName}</span></div>
                  <div><span className="text-stone-pale">Email</span><br /><span className="text-stone">{selectedOrder.customerEmail}</span></div>
                  <div><span className="text-stone-pale">Phone</span><br /><span className="text-stone">{selectedOrder.customerPhone || '-'}</span></div>
                  <div><span className="text-stone-pale">Country</span><br /><span className="text-stone">{selectedOrder.country}</span></div>
                </div>
                <p className="text-sm text-stone-mid mt-2 font-sans">
                  {selectedOrder.address}, {selectedOrder.city} {selectedOrder.postcode}
                </p>
                {selectedOrder.notes && (
                  <p className="text-sm text-stone-mid mt-2 italic font-sans">Note: {selectedOrder.notes}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="form-label">Production Tracker</p>
                  <div className="flex items-center gap-2">
                    {selectedOrder.production.isDelayed ? (
                      <span className="text-xs font-sans uppercase tracking-[0.18em] text-red-700">
                        Delayed {selectedOrder.production.delayDays}d
                      </span>
                    ) : null}
                    <span className="text-xs font-sans uppercase tracking-[0.22em] text-gold">
                      {selectedOrder.productionStage}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                  <div className="border border-beige bg-cream p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-pale font-sans">Priority</p>
                    <p className={`font-serif text-xl mt-2 ${selectedOrder.production.isUrgent ? 'text-amber-700' : 'text-stone'}`}>
                      {PRODUCTION_PRIORITY_LABELS[selectedOrder.productionPriority]}
                    </p>
                  </div>
                  <div className="border border-beige bg-cream p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-pale font-sans">Current Stage</p>
                    <p className="font-serif text-xl text-stone mt-2">
                      {selectedOrder.production.daysInCurrentStage}d / {selectedOrder.production.estimatedStageDays}d
                    </p>
                  </div>
                  <div className="border border-beige bg-cream p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-pale font-sans">Stage Due</p>
                    <p className="font-serif text-xl text-stone mt-2">
                      {formatDateTime(selectedOrder.production.estimatedStageDueAt)}
                    </p>
                  </div>
                  <div className="border border-beige bg-cream p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-pale font-sans">Completion ETA</p>
                    <p className="font-serif text-xl text-stone mt-2">
                      {formatDateTime(selectedOrder.production.estimatedCompletionAt)}
                    </p>
                  </div>
                </div>
                <ProductionProgressBar stage={selectedOrder.productionStage} />
                <div className="flex flex-wrap gap-2 mt-4">
                  {PRODUCTION_STAGES.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => patchOrder(selectedOrder.id, { productionStage: stage })}
                      disabled={updating || selectedOrder.productionStage === stage}
                      className={`px-4 py-2 text-xs font-sans uppercase tracking-widest border transition-colors ${
                        selectedOrder.productionStage === stage
                          ? 'bg-stone text-cream border-stone cursor-default'
                          : 'border-beige text-stone-mid hover:border-gold hover:text-gold'
                      } disabled:opacity-60`}
                    >
                      {PRODUCTION_STAGE_LABELS[stage]}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="form-label mb-3">Production Priority</p>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCTION_PRIORITIES.map((priority) => (
                      <button
                        key={priority}
                        onClick={() => patchOrder(selectedOrder.id, { productionPriority: priority })}
                        disabled={updating || selectedOrder.productionPriority === priority}
                        className={`px-4 py-2 text-xs font-sans uppercase tracking-widest border transition-colors ${
                          selectedOrder.productionPriority === priority
                            ? priority === 'urgent'
                              ? 'bg-amber-600 text-white border-amber-600 cursor-default'
                              : 'bg-stone text-cream border-stone cursor-default'
                            : 'border-beige text-stone-mid hover:border-gold hover:text-gold'
                        } disabled:opacity-60`}
                      >
                        {PRODUCTION_PRIORITY_LABELS[priority]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-6">
                  <p className="form-label mb-3">Production Timeline</p>
                  <ProductionTimeline production={selectedOrder.production} />
                </div>
              </div>

              <div>
                <p className="form-label mb-3">Items</p>
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="text-left border-b border-beige">
                      <th className="pb-2 text-stone-pale font-normal text-xs uppercase tracking-wider">Product</th>
                      <th className="pb-2 text-stone-pale font-normal text-xs uppercase tracking-wider">Qty</th>
                      <th className="pb-2 text-stone-pale font-normal text-xs uppercase tracking-wider text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id} className="border-b border-beige/50">
                        <td className="py-2 text-stone">{item.name}</td>
                        <td className="py-2 text-stone-mid">{item.quantity}</td>
                        <td className="py-2 text-stone text-right">{money(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 text-right space-y-1 text-sm font-sans">
                  <p className="text-stone-mid">Subtotal: {money(selectedOrder.subtotal)}</p>
                  <p className="text-stone-mid">Shipping: {money(selectedOrder.shipping)}</p>
                  <p className="text-stone font-medium text-base">Total: {money(selectedOrder.total)}</p>
                </div>
              </div>

              <div>
                <p className="form-label mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => patchOrder(selectedOrder.id, { status })}
                      disabled={updating || selectedOrder.status === status}
                      className={`px-4 py-2 text-xs font-sans uppercase tracking-widest border transition-colors ${
                        selectedOrder.status === status
                          ? 'bg-stone text-cream border-stone cursor-default'
                          : 'border-beige text-stone-mid hover:border-gold hover:text-gold'
                      } disabled:opacity-60`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

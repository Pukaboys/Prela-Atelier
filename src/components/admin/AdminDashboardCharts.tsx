'use client'

import { useMemo, useState } from 'react'
import { formatPrice, type CurrencyFormatOptions } from '@/lib/helpers'

type RevenuePoint = {
  label: string
  revenue: number
  orders: number
}

type RankingItem = {
  label: string
  quantity: number
  revenue: number
}

type StatusPoint = {
  label: string
  value: number
}

type TrendSummary = {
  current: number
  previous: number
  changePercent: number
}

type ConversionMetrics = {
  totalOrders: number
  totalEnquiries: number
  totalOrderShare: number
  totalOrdersPerEnquiry: number | null
  recentOrders: number
  recentEnquiries: number
  recentOrderShare: number
  recentOrdersPerEnquiry: number | null
}

type DashboardAnalytics = {
  revenue: {
    daily: RevenuePoint[]
    monthly: RevenuePoint[]
  }
  orderTrend: {
    daily: TrendSummary
    monthly: TrendSummary
  }
  topProducts: RankingItem[]
  topMaterials: RankingItem[]
  orderStatusBreakdown: StatusPoint[]
  conversion: ConversionMetrics
}

const CHART_COLORS = ['#b08d57', '#3a322e', '#7d6a52', '#d7c7ac', '#c96f5d', '#e9dcc6']

function formatTrend(changePercent: number) {
  if (changePercent > 0) return `+${changePercent}%`
  if (changePercent < 0) return `${changePercent}%`
  return '0%'
}

function clampLabel(label: string, max = 22) {
  if (label.length <= max) return label
  return `${label.slice(0, max - 1)}...`
}

function describeLineChart(points: RevenuePoint[]) {
  const width = 720
  const height = 280
  const paddingX = 22
  const paddingTop = 18
  const paddingBottom = 34
  const innerWidth = width - paddingX * 2
  const innerHeight = height - paddingTop - paddingBottom
  const maxValue = Math.max(...points.map((point) => point.revenue), 1)
  const minValue = 0

  const chartPoints = points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : paddingX + (index / Math.max(points.length - 1, 1)) * innerWidth
    const normalized = (point.revenue - minValue) / (maxValue - minValue || 1)
    const y = paddingTop + innerHeight - normalized * innerHeight
    return {
      ...point,
      x,
      y,
    }
  })

  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')

  const areaPath = chartPoints.length
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x.toFixed(2)} ${(height - paddingBottom).toFixed(2)} L ${chartPoints[0].x.toFixed(2)} ${(height - paddingBottom).toFixed(2)} Z`
    : ''

  const gridValues = Array.from({ length: 4 }, (_, index) => {
    const value = (maxValue / 3) * index
    const y = paddingTop + innerHeight - (value / (maxValue || 1)) * innerHeight
    return { value, y }
  }).reverse()

  return {
    width,
    height,
    paddingBottom,
    chartPoints,
    linePath,
    areaPath,
    gridValues,
  }
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  }
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

function TrendMetricCard({
  title,
  subtitle,
  current,
  previous,
  changePercent,
}: {
  title: string
  subtitle: string
  current: number
  previous: number
  changePercent: number
}) {
  return (
    <div className="border border-beige bg-white p-5">
      <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">{title}</p>
      <p className="font-serif text-3xl text-stone mt-3">{current}</p>
      <div className="flex items-end justify-between gap-4 mt-3">
        <p className="text-xs font-sans text-stone-mid">{subtitle}: {previous}</p>
        <p
          className={`text-xs font-sans uppercase tracking-[0.18em] ${
            changePercent >= 0 ? 'text-gold' : 'text-red-600'
          }`}
        >
          {formatTrend(changePercent)}
        </p>
      </div>
    </div>
  )
}

function RevenueLineChart({
  points,
  currencyOptions,
}: {
  points: RevenuePoint[]
  currencyOptions: CurrencyFormatOptions
}) {
  const chart = useMemo(() => describeLineChart(points), [points])

  if (points.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm font-sans text-stone-mid border border-dashed border-beige">
        No revenue data yet.
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="w-full h-full">
        {chart.gridValues.map((grid) => (
          <g key={`${grid.value}-${grid.y}`}>
            <line
              x1="0"
              y1={grid.y}
              x2={chart.width}
              y2={grid.y}
              stroke="rgba(176,141,87,0.14)"
              strokeWidth="1"
            />
            <text
              x="4"
              y={grid.y - 6}
              fontSize="10"
              fill="#8f847d"
            >
              {formatPrice(grid.value, currencyOptions)}
            </text>
          </g>
        ))}

        {chart.areaPath ? (
          <path d={chart.areaPath} fill="rgba(176, 141, 87, 0.16)" />
        ) : null}
        {chart.linePath ? (
          <path d={chart.linePath} fill="none" stroke="#b08d57" strokeWidth="3" />
        ) : null}

        {chart.chartPoints.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" fill="#faf8f4" stroke="#b08d57" strokeWidth="2" />
            <title>{`${point.label}: ${formatPrice(point.revenue, currencyOptions)} | ${point.orders} orders`}</title>
          </g>
        ))}
      </svg>

      <div
        className="grid gap-2 mt-3 text-[10px] uppercase tracking-[0.18em] text-stone-pale font-sans"
        style={{ gridTemplateColumns: `repeat(${Math.max(points.length, 1)}, minmax(0, 1fr))` }}
      >
        {points.map((point) => (
          <span key={point.label} className="text-center">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function RankingBars({
  items,
  currencyOptions,
}: {
  items: RankingItem[]
  currencyOptions: CurrencyFormatOptions
}) {
  const maxQuantity = Math.max(...items.map((item) => item.quantity), 1)

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm font-sans text-stone-mid border border-dashed border-beige">
        No ranking data yet.
      </div>
    )
  }

  return (
    <div className="h-full border border-beige bg-cream p-4 flex flex-col gap-4">
      {items.map((item, index) => {
        const width = `${Math.max((item.quantity / maxQuantity) * 100, 6)}%`
        return (
          <div key={`${item.label}-${index}`} className="space-y-2">
            <div className="flex items-start justify-between gap-3 text-sm font-sans text-stone">
              <span className="font-medium">{clampLabel(item.label, 28)}</span>
              <span className="text-stone-pale whitespace-nowrap">{item.quantity} units</span>
            </div>
            <div className="h-3 bg-white border border-beige overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-[#d7c7ac]"
                style={{ width }}
                title={`${item.quantity} sold | ${formatPrice(item.revenue, currencyOptions)}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatusPieChart({ items }: { items: StatusPoint[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  if (total <= 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm font-sans text-stone-mid">
        No order data yet.
      </div>
    )
  }

  let currentAngle = 0
  const segments = items
    .filter((item) => item.value > 0)
    .map((item, index) => {
      const angle = (item.value / total) * 360
      const path = describeArc(90, 90, 74, currentAngle, currentAngle + angle)
      const segment = {
        ...item,
        path,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }
      currentAngle += angle
      return segment
    })

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <svg viewBox="0 0 180 180" className="w-full max-w-[220px]">
        {segments.map((segment) => (
          <path key={segment.label} d={segment.path} fill={segment.color}>
            <title>{`${segment.label}: ${segment.value}`}</title>
          </path>
        ))}
        <circle cx="90" cy="90" r="36" fill="#faf8f4" />
        <text x="90" y="84" textAnchor="middle" fontSize="12" fill="#8f847d">
          Orders
        </text>
        <text x="90" y="102" textAnchor="middle" fontSize="20" fill="#3a322e">
          {total}
        </text>
      </svg>

      <div className="grid grid-cols-1 gap-2 w-full">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-3 text-sm font-sans text-stone-mid">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block h-3 w-3 shrink-0" style={{ backgroundColor: segment.color }} />
              <span className="truncate">{segment.label}</span>
            </div>
            <span className="text-stone">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboardCharts({
  analytics,
  currencyOptions,
}: {
  analytics: DashboardAnalytics
  currencyOptions: CurrencyFormatOptions
}) {
  const [revenueMode, setRevenueMode] = useState<'daily' | 'monthly'>('daily')
  const [rankingMode, setRankingMode] = useState<'products' | 'materials'>('products')

  const revenueSeries = analytics.revenue[revenueMode]
  const rankingSeries = rankingMode === 'products' ? analytics.topProducts : analytics.topMaterials
  const totalRevenue = useMemo(
    () => revenueSeries.reduce((sum, point) => sum + point.revenue, 0),
    [revenueSeries],
  )
  const totalOrders = useMemo(
    () => revenueSeries.reduce((sum, point) => sum + point.orders, 0),
    [revenueSeries],
  )

  return (
    <div className="space-y-6 mb-10">
      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr,0.55fr] gap-6">
        <div className="border border-beige bg-white p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">Revenue Over Time</p>
              <h2 className="font-serif text-2xl text-stone mt-2">Commercial Performance</h2>
            </div>
            <div className="flex items-center gap-2">
              {(['daily', 'monthly'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRevenueMode(mode)}
                  className={`px-4 py-2 text-xs font-sans uppercase tracking-[0.2em] border ${
                    revenueMode === mode
                      ? 'bg-stone text-cream border-stone'
                      : 'border-beige text-stone-mid hover:border-gold hover:text-gold'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="border border-beige bg-cream px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">Revenue</p>
              <p className="font-serif text-2xl text-stone mt-2">{formatPrice(totalRevenue, currencyOptions)}</p>
            </div>
            <div className="border border-beige bg-cream px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">Orders in Period</p>
              <p className="font-serif text-2xl text-stone mt-2">{totalOrders}</p>
            </div>
            <div className="border border-beige bg-cream px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">Period</p>
              <p className="font-serif text-2xl text-stone mt-2">{revenueMode === 'daily' ? '14 Days' : '12 Months'}</p>
            </div>
          </div>

          <div className="h-[320px]">
            <RevenueLineChart points={revenueSeries} currencyOptions={currencyOptions} />
          </div>
        </div>

        <div className="border border-beige bg-white p-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">Conversion Metrics</p>
          <h2 className="font-serif text-2xl text-stone mt-2 mb-6">Orders vs Enquiries</h2>

          <div className="space-y-4">
            <div className="border border-beige bg-cream p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">All Time</p>
              <p className="font-serif text-2xl text-stone mt-2">{analytics.conversion.totalOrderShare}%</p>
              <p className="text-sm font-sans text-stone-mid mt-2">
                {analytics.conversion.totalOrders} orders vs {analytics.conversion.totalEnquiries} enquiries
              </p>
              <p className="text-xs font-sans text-stone-pale mt-1">
                {analytics.conversion.totalOrdersPerEnquiry != null
                  ? `${analytics.conversion.totalOrdersPerEnquiry} orders per enquiry`
                  : 'No enquiry benchmark yet'}
              </p>
            </div>

            <div className="border border-beige bg-cream p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">Last 30 Days</p>
              <p className="font-serif text-2xl text-stone mt-2">{analytics.conversion.recentOrderShare}%</p>
              <p className="text-sm font-sans text-stone-mid mt-2">
                {analytics.conversion.recentOrders} orders vs {analytics.conversion.recentEnquiries} enquiries
              </p>
              <p className="text-xs font-sans text-stone-pale mt-1">
                {analytics.conversion.recentOrdersPerEnquiry != null
                  ? `${analytics.conversion.recentOrdersPerEnquiry} orders per enquiry`
                  : 'No recent enquiry benchmark yet'}
              </p>
            </div>

            <div className="border border-beige p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">Order Status Mix</p>
              <div className="h-[240px] mt-4">
                <StatusPieChart items={analytics.orderStatusBreakdown} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TrendMetricCard
          title="Daily Orders Trend"
          subtitle="Previous 7 days"
          current={analytics.orderTrend.daily.current}
          previous={analytics.orderTrend.daily.previous}
          changePercent={analytics.orderTrend.daily.changePercent}
        />
        <TrendMetricCard
          title="Monthly Orders Trend"
          subtitle="Previous 6 months"
          current={analytics.orderTrend.monthly.current}
          previous={analytics.orderTrend.monthly.previous}
          changePercent={analytics.orderTrend.monthly.changePercent}
        />
      </div>

      <div className="border border-beige bg-white p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">Best Sellers</p>
            <h2 className="font-serif text-2xl text-stone mt-2">Products and Materials</h2>
          </div>
          <div className="flex items-center gap-2">
            {(['products', 'materials'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setRankingMode(mode)}
                className={`px-4 py-2 text-xs font-sans uppercase tracking-[0.2em] border ${
                  rankingMode === mode
                    ? 'bg-stone text-cream border-stone'
                    : 'border-beige text-stone-mid hover:border-gold hover:text-gold'
                }`}
              >
                Top {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr] gap-6">
          <div className="h-[320px]">
            <RankingBars items={rankingSeries} currencyOptions={currencyOptions} />
          </div>

          <div className="space-y-3">
            {rankingSeries.length > 0 ? (
              rankingSeries.map((item, index) => (
                <div key={`${item.label}-${index}`} className="border border-beige bg-cream px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">
                        Rank {index + 1}
                      </p>
                      <p className="font-serif text-xl text-stone mt-2">{item.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-2xl text-stone">{item.quantity}</p>
                      <p className="text-xs font-sans text-stone-pale uppercase tracking-[0.18em]">Units</p>
                    </div>
                  </div>
                  <p className="text-sm font-sans text-stone-mid mt-3">
                    Revenue contribution: {formatPrice(item.revenue, currencyOptions)}
                  </p>
                </div>
              ))
            ) : (
              <div className="border border-dashed border-beige px-4 py-6 text-sm font-sans text-stone-mid">
                No completed sales data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

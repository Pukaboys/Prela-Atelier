import { formatPrice, type CurrencyFormatOptions } from '@/lib/helpers'
import type { AnalyticsIntelligence } from '@/server/services/analytics-intelligence-service'

function riskClass(riskLevel: string) {
  if (riskLevel === 'High') return 'bg-red-50 text-red-700 border-red-200'
  if (riskLevel === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

function trendClass(trend: string) {
  if (trend === 'growing') return 'text-emerald-700'
  if (trend === 'declining') return 'text-red-700'
  return 'text-gold'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function EmptyInsight({ label }: { label: string }) {
  return (
    <div className="border border-dashed border-beige bg-cream px-4 py-6 text-sm font-sans text-stone-mid">
      {label}
    </div>
  )
}

export default function AdminDashboardInsights({
  intelligence,
  currencyOptions,
}: {
  intelligence: AnalyticsIntelligence
  currencyOptions: CurrencyFormatOptions
}) {
  const prediction = intelligence.revenuePrediction
  const segments = [
    {
      label: 'VIP',
      description: `Spend above ${formatPrice(intelligence.customerSegments.vipThreshold, currencyOptions)}`,
      data: intelligence.customerSegments.vip,
    },
    {
      label: 'Frequent Buyers',
      description: 'Two or more confirmed purchases',
      data: intelligence.customerSegments.frequentBuyers,
    },
    {
      label: 'One-Time Buyers',
      description: 'Single confirmed purchase',
      data: intelligence.customerSegments.oneTimeBuyers,
    },
  ]

  return (
    <section className="space-y-6 mb-10">
      <div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-gold font-sans">Business Intelligence</p>
        <h2 className="font-serif text-3xl text-stone mt-2">Insights &amp; Predictions</h2>
        <p className="text-sm font-sans text-stone-mid mt-2 max-w-3xl">
          Smart operational signals calculated from existing orders, order items, products, and customer purchase history.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr,1.1fr] gap-6">
        <div className="border border-beige bg-white p-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">
            Future Revenue
          </p>
          <div className="flex items-start justify-between gap-5 mt-3">
            <div>
              <p className="font-serif text-4xl text-stone">
                {formatPrice(prediction.next30DaysRevenue, currencyOptions)}
              </p>
              <p className="text-sm font-sans text-stone-mid mt-2">Projected revenue for the next 30 days</p>
            </div>
            <div className="text-right">
              <p className={`text-xs uppercase tracking-[0.22em] font-sans ${trendClass(prediction.trend)}`}>
                {prediction.trend}
              </p>
              <p className="text-xs font-sans text-stone-pale mt-2">{prediction.confidence} confidence</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <div className="border border-beige bg-cream p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-pale font-sans">Monthly Baseline</p>
              <p className="font-serif text-2xl text-stone mt-2">
                {formatPrice(prediction.baselineMonthlyRevenue, currencyOptions)}
              </p>
            </div>
            <div className="border border-beige bg-cream p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-pale font-sans">Trend Delta</p>
              <p className="font-serif text-2xl text-stone mt-2">
                {formatPrice(prediction.trendDelta, currencyOptions)}
              </p>
            </div>
          </div>

          <p className="text-xs font-sans text-stone-pale mt-5 leading-relaxed">
            Method: {prediction.method}. This is a directional business estimate, not an accounting forecast.
          </p>
        </div>

        <div className="border border-beige bg-white p-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">
            Most Likely Best Sellers
          </p>
          <h3 className="font-serif text-2xl text-stone mt-2 mb-5">Demand Forecast</h3>

          {intelligence.likelyBestSellers.length === 0 ? (
            <EmptyInsight label="No sales history yet for demand prediction." />
          ) : (
            <div className="space-y-3">
              {intelligence.likelyBestSellers.map((product, index) => (
                <div key={product.id} className="border border-beige bg-cream px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">
                        Prediction #{index + 1}
                      </p>
                      <p className="font-serif text-xl text-stone mt-2">{product.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-2xl text-stone">{product.demandScore}</p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-stone-pale font-sans">
                        Score
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-sans text-stone-mid mt-3">
                    {product.unitsSold} total units, {product.recentUnitsSold} recent units,{' '}
                    {formatPrice(product.revenue, currencyOptions)} revenue.
                  </p>
                  <p className="text-xs font-sans text-stone-pale mt-1">{product.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr] gap-6">
        <div className="border border-beige bg-white p-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">
            Slow-Moving Products
          </p>
          <h3 className="font-serif text-2xl text-stone mt-2 mb-5">Inventory Attention</h3>

          {intelligence.slowMovingProducts.length === 0 ? (
            <EmptyInsight label="No slow-moving products detected from current product and order data." />
          ) : (
            <div className="space-y-3">
              {intelligence.slowMovingProducts.map((product) => (
                <div key={product.id} className="border border-beige bg-cream px-4 py-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <p className="font-serif text-xl text-stone">{product.label}</p>
                      <p className="text-sm font-sans text-stone-mid mt-2">
                        Stock: {product.stock} | Sold: {product.unitsSold} | Recent: {product.recentUnitsSold}
                      </p>
                      <p className="text-xs font-sans text-stone-pale mt-1">
                        {product.daysSinceLastSale === null
                          ? 'No recorded sales yet.'
                          : `${product.daysSinceLastSale} days since last sale.`}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit border px-3 py-1 text-[10px] uppercase tracking-[0.18em] font-sans ${riskClass(product.riskLevel)}`}
                    >
                      {product.riskLevel} risk
                    </span>
                  </div>
                  <p className="text-sm font-sans text-stone-mid mt-3">{product.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-beige bg-white p-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">
            High-Value Customers
          </p>
          <h3 className="font-serif text-2xl text-stone mt-2 mb-5">Client Value Ranking</h3>

          {intelligence.highValueCustomers.length === 0 ? (
            <EmptyInsight label="No confirmed customer purchase history yet." />
          ) : (
            <div className="space-y-3">
              {intelligence.highValueCustomers.map((customer, index) => (
                <div key={customer.email} className="border border-beige bg-cream px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">
                        Client #{index + 1}
                      </p>
                      <p className="font-serif text-xl text-stone mt-2 truncate">{customer.name}</p>
                      <p className="text-xs font-sans text-stone-pale truncate">{customer.email}</p>
                    </div>
                    <p className="font-serif text-2xl text-stone whitespace-nowrap">
                      {formatPrice(customer.totalSpend, currencyOptions)}
                    </p>
                  </div>
                  <p className="text-sm font-sans text-stone-mid mt-3">
                    {customer.orderCount} order{customer.orderCount === 1 ? '' : 's'} | Average order{' '}
                    {formatPrice(customer.averageOrderValue, currencyOptions)} | Last order{' '}
                    {formatDate(customer.lastOrderDate)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border border-beige bg-white p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-stone-pale font-sans">
              Customer Segmentation
            </p>
            <h3 className="font-serif text-2xl text-stone mt-2">Client Portfolio</h3>
          </div>
          <p className="text-sm font-sans text-stone-mid">
            {intelligence.customerSegments.totalCustomers} purchasing customers analysed
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {segments.map((segment) => (
            <div key={segment.label} className="border border-beige bg-cream p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">
                {segment.label}
              </p>
              <div className="flex items-end justify-between gap-4 mt-3">
                <p className="font-serif text-4xl text-stone">{segment.data.count}</p>
                <p className="text-right text-sm font-sans text-stone-mid">
                  {formatPrice(segment.data.revenue, currencyOptions)}
                </p>
              </div>
              <p className="text-xs font-sans text-stone-pale mt-2">{segment.description}</p>
              <p className="text-sm font-sans text-stone-mid mt-4">
                Average spend: {formatPrice(segment.data.averageSpend, currencyOptions)}
              </p>
              {segment.data.examples.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {segment.data.examples.map((customer) => (
                    <div key={customer.email} className="flex items-center justify-between gap-3 text-xs font-sans">
                      <span className="text-stone-mid truncate">{customer.name}</span>
                      <span className="text-stone whitespace-nowrap">
                        {formatPrice(customer.totalSpend, currencyOptions)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-sans text-stone-pale mt-4">No customers in this segment yet.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

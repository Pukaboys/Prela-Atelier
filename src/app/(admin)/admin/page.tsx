import type { Metadata } from 'next'
import Link from 'next/link'
import AdminDashboardCharts from '@/components/admin/AdminDashboardCharts'
import AdminDashboardInsights from '@/components/admin/AdminDashboardInsights'
import AdminDashboardReports from '@/components/admin/AdminDashboardReports'
import { formatPrice, getCurrencyFormatOptions } from '@/lib/helpers'
import { getSettings } from '@/lib/settings'
import { getAdminDashboardOverview } from '@/server/services/dashboard-service'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  const [dashboard, settings] = await Promise.all([getAdminDashboardOverview(), getSettings()])
  const currencyOptions = getCurrencyFormatOptions(settings)

  const stats = [
    {
      label: 'Total Products',
      value: dashboard.stats.totalProducts,
      href: '/admin/products',
      color: 'bg-beige border-beige-dark',
    },
    {
      label: 'Total Orders',
      value: dashboard.stats.totalOrders,
      href: '/admin/orders',
      color: 'bg-white border-beige',
    },
    {
      label: 'Pending Orders',
      value: dashboard.stats.pendingOrders,
      href: '/admin/orders',
      color:
        dashboard.stats.pendingOrders > 0
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-beige',
    },
    {
      label: 'New Enquiries',
      value: dashboard.stats.newEnquiries,
      href: '/admin/enquiries',
      color:
        dashboard.stats.newEnquiries > 0
          ? 'bg-gold/10 border-gold/30'
          : 'bg-white border-beige',
    },
    {
      label: 'Confirmed Revenue',
      value: formatPrice(dashboard.stats.confirmedRevenue, currencyOptions),
      href: '/admin/orders',
      color: 'bg-white border-beige',
    },
  ]

  const statusClass: Record<string, string> = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    shipped: 'status-shipped',
    cancelled: 'status-cancelled',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-stone">Dashboard</h1>
        <p className="text-stone-mid text-sm font-sans mt-1">
          Welcome back. Here&apos;s what&apos;s happening with Prela Atelier.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`border ${stat.color} p-6 hover:shadow-card transition-shadow duration-200 group`}
          >
            <p className="text-xs tracking-widest uppercase text-stone-mid font-sans mb-3 group-hover:text-gold transition-colors">
              {stat.label}
            </p>
            <p className="font-serif text-3xl text-stone">{stat.value}</p>
          </Link>
        ))}
      </div>

      <AdminDashboardCharts analytics={dashboard.analytics} currencyOptions={currencyOptions} />

      <AdminDashboardInsights
        intelligence={dashboard.intelligence}
        currencyOptions={currencyOptions}
      />

      <AdminDashboardReports />

      <div className="bg-white border border-beige">
        <div className="px-6 py-4 border-b border-beige flex items-center justify-between">
          <h2 className="font-serif text-xl text-stone">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs tracking-widest uppercase text-gold hover:text-gold-dark transition-colors font-sans"
          >
            View all {'->'}
          </Link>
        </div>
        <div className="overflow-x-auto">
          {dashboard.recentOrders.length === 0 ? (
            <p className="text-stone-mid text-sm font-sans p-6">No orders yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentOrders.map((order) => {
                  const displayStatus = order.status === 'delivered' ? 'shipped' : order.status

                  return (
                    <tr key={order.id}>
                      <td className="font-mono text-xs text-gold">{order.orderCode}</td>
                      <td>{order.customerName}</td>
                      <td>{formatPrice(order.total, currencyOptions)}</td>
                      <td>
                        <span className={statusClass[displayStatus] ?? 'badge'}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="text-stone-mid text-xs">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        {[
          { href: '/admin/products', label: 'Manage Products' },
          { href: '/admin/inventory', label: 'Manage Inventory' },
          { href: '/admin/orders', label: 'Manage Orders' },
          { href: '/admin/materials', label: 'Manage Stones' },
          { href: '/admin/enquiries', label: 'View Enquiries' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="border border-beige bg-white px-5 py-4 text-xs tracking-widest uppercase text-stone-mid font-sans hover:border-gold hover:text-gold transition-all duration-200 text-center"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}

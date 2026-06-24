import { requireAdmin } from '@/lib/auth'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata = {
  title: {
    default: 'Admin — Prela Atelier',
    template: '%s | Admin',
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  return <AdminShell>{children}</AdminShell>
}

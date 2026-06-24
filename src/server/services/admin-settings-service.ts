import prisma from '@/lib/db'

export async function applyAdminSettingsUpdate(
  adminId: number,
  settings: Record<string, string>,
  account: { username?: string; email?: string },
  passwordHash?: string,
) {
  await Promise.all(
    Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  )

  if (account.email !== undefined) {
    await prisma.setting.upsert({
      where: { key: 'admin_email' },
      update: { value: account.email },
      create: { key: 'admin_email', value: account.email },
    })
  }

  const adminUpdate: Record<string, unknown> = {}
  if (account.username) adminUpdate.username = account.username
  if (passwordHash) adminUpdate.password = passwordHash
  if (Object.keys(adminUpdate).length > 0) {
    await prisma.admin.update({ where: { id: adminId }, data: adminUpdate })
  }
}

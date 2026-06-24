import type { MetadataRoute } from 'next'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    select: { slug: true },
    orderBy: { id: 'asc' },
  })

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/materials`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/bespoke`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/care`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/product/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  return [...staticRoutes, ...productRoutes]
}

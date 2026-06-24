/**
 * Prela Atelier - Database Seed
 * Run: npm run db:seed
 * Requires DATABASE_URL in .env
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getMaterialPriceSettingKey } from '../src/lib/material-pricing'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const password = await bcrypt.hash('admin123', 12)
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: { password },
    create: { username: 'admin', password },
  })
  console.log('Admin seeded (username: admin password: admin123)')

  const materials = [
    {
      name: 'Carrara White',
      origin: 'Tuscany, Italy',
      description: "The most celebrated marble in the world. Carrara's cool white ground and soft grey veining have graced the sculptures of Michelangelo and the floors of Rome's great basilicas. We use it for pieces where restraint and clarity are paramount.",
      hardness: '3-4 Mohs',
      tone: 'Cool white',
      veining: 'Fine grey',
      sortOrder: 1,
      pricePerM2Eur: 950,
    },
    {
      name: 'Calacatta Gold',
      origin: 'Apuan Alps, Italy',
      description: 'Rarer and more dramatic than Carrara, Calacatta is distinguished by its brilliant white base and bold, sweeping veins of gold and grey. Each slab is effectively unique - no two pieces share the same movement. Our most sought-after material.',
      hardness: '3-4 Mohs',
      tone: 'Warm white',
      veining: 'Gold & grey',
      sortOrder: 2,
      pricePerM2Eur: 1375,
    },
    {
      name: 'Marquina Black',
      origin: 'Basque Country, Spain',
      description: 'A profound, near-perfect black with thin white veins that trace across the surface like ink on paper. Marquina creates a striking counterpoint to lighter interiors - authoritative, dramatic, and deeply elegant.',
      hardness: '3-4 Mohs',
      tone: 'Deep black',
      veining: 'White',
      sortOrder: 3,
      pricePerM2Eur: 1188,
    },
    {
      name: 'Travertine',
      origin: 'Tivoli, Italy',
      description: 'Formed in mineral springs, travertine carries a warm, earthy palette of cream, ivory, and walnut - interrupted by the characteristic pores and channels left by ancient bubbling water. It brings softness and a sense of geological time to any surface.',
      hardness: '3 Mohs',
      tone: 'Warm cream',
      veining: 'Porous',
      sortOrder: 4,
      pricePerM2Eur: 900,
    },
    {
      name: 'Honey Onyx',
      origin: 'Iran & Turkey',
      description: 'The most luminous of all stones - onyx is translucent, allowing light to pass through when backlit. Its warm amber and honey tones shift throughout the day as the light changes. We use it selectively, for pieces where light itself becomes part of the design.',
      hardness: '2.5-3 Mohs',
      tone: 'Amber gold',
      veining: 'Translucent',
      sortOrder: 5,
      pricePerM2Eur: 1475,
    },
    {
      name: 'Emperador Dark',
      origin: 'Alicante, Spain',
      description: "A rich chocolate brown marble threaded with intricate white and gold veins. Emperador's warmth makes it a natural companion to wood, leather, and brass - materials often found in the interiors our clients create.",
      hardness: '3-4 Mohs',
      tone: 'Deep brown',
      veining: 'Gold & white',
      sortOrder: 6,
      pricePerM2Eur: 1120,
    },
  ]

  for (const material of materials) {
    const savedMaterial = await prisma.material.upsert({
      where: { id: material.sortOrder },
      update: {},
      create: {
        name: material.name,
        origin: material.origin,
        description: material.description,
        hardness: material.hardness,
        tone: material.tone,
        veining: material.veining,
        sortOrder: material.sortOrder,
        visible: true,
      },
    })

    await prisma.setting.upsert({
      where: { key: getMaterialPriceSettingKey(savedMaterial.id) },
      update: { value: material.pricePerM2Eur.toFixed(2) },
      create: {
        key: getMaterialPriceSettingKey(savedMaterial.id),
        value: material.pricePerM2Eur.toFixed(2),
      },
    })
  }
  console.log('Materials seeded (6)')

  const products = [
    { slug: 'marble-tray-bianco', name: 'Marble Tray Bianco', description: 'Hand-carved from a single block of Carrara Bianco marble, this serving tray embodies understated luxury. Its smooth, cool surface and natural veining make every piece utterly unique. Perfect for entryways, vanities, and curated tablescapes.', priceEur: 195.0, badge: 'BESTSELLER', stock: 12, featured: true },
    { slug: 'marble-candle-holder-nero', name: 'Marble Candle Holder Nero', description: 'Sculpted from deep Marquina black marble with striking white veining, this candle holder transforms any space into a sanctuary of calm. Fits standard pillar candles. Available as a set of two.', priceEur: 145.0, badge: 'NEW', stock: 8, featured: true },
    { slug: 'marble-vase-calacatti', name: 'Marble Vase Calacatti', description: 'A statement vessel carved from the finest Calacatti marble sourced from the quarries of Apuan Alps. The tall cylindrical form and dramatic gold veining create a sculptural presence in any interior.', priceEur: 320.0, badge: 'LIMITED', stock: 5, featured: true },
    { slug: 'marble-bowl-travertine', name: 'Marble Bowl Travertine', description: 'This generous bowl in warm Roman travertine is as functional as it is beautiful. Use it to display fruit, keys, or simply let its organic texture speak for itself. A centrepiece worthy of a gallery.', priceEur: 175.0, badge: null, stock: 15, featured: true },
    { slug: 'marble-bookends-onyx', name: 'Marble Bookends Onyx', description: 'Paired bookends hand-shaped from honey onyx, each one veined differently by nature. A refined addition to any bookshelf or desk. Sold as a pair.', priceEur: 265.0, badge: 'LIMITED', stock: 4, featured: false },
    { slug: 'marble-coaster-set', name: 'Marble Coaster Set', description: 'A set of four coasters in Botticino cream marble with gold-leaf edge detailing. Protect your surfaces in style. Presented in a Prela Atelier linen box - ideal as a gift.', priceEur: 89.0, badge: 'NEW', stock: 20, featured: false },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceEur: product.priceEur,
        badge: product.badge,
        stock: product.stock,
        featured: product.featured,
      },
    })
  }
  console.log('Products seeded (6)')

  console.log('\nSeed complete.')
  console.log('Admin login -> username: admin | password: admin123\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

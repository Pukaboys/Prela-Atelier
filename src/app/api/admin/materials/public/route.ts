import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { generateSlug, productImageUrl } from '@/lib/helpers'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.prela-atelier.com'

function requestOrigin(request: NextRequest) {
  const origin = request.nextUrl.origin
  return origin.includes('localhost') ? SITE_URL : origin
}

function absoluteImageUrl(path: string | null | undefined, origin: string) {
  const imagePath = productImageUrl(path)
  return imagePath.startsWith('http') ? imagePath : `${origin}${imagePath}`
}

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request)

  const materials = await prisma.material.findMany({
    where: { visible: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      origin: true,
      description: true,
      imagePath: true,
    },
  })

  return NextResponse.json(
    materials.map((material) => ({
      id: material.id,
      name: material.name,
      slug: generateSlug(material.name),
      description: material.description,
      imagePath: absoluteImageUrl(material.imagePath, origin),
      colorHex: null,
      origin: material.origin,
    })),
  )
}

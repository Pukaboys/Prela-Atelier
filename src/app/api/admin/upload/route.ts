import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireAdmin } from '@/lib/auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  await requireAdmin()

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Storage not configured. Add BLOB_READ_WRITE_TOKEN to environment variables.' },
      { status: 503 }
    )
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed.' }, { status: 415 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File exceeds 5 MB limit.' }, { status: 413 })
  }

  // Sanitise filename
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const base = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
  const filename = `${base}-${Date.now()}.${ext}`

  try {
    const blob = await put(filename, file, { access: 'public' })
    return NextResponse.json({ path: blob.url }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

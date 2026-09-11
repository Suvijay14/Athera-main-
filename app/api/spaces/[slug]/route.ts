import { NextRequest, NextResponse } from 'next/server'
import { deleteSpace, getSpaceBySlug } from '@/lib/server/spaces'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const space = getSpaceBySlug(params.slug)
  if (!space) {
    return NextResponse.json({ error: 'Space not found' }, { status: 404 })
  }

  deleteSpace(params.slug)
  return NextResponse.json({ deleted: true, slug: params.slug })
}

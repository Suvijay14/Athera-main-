import { NextRequest, NextResponse } from 'next/server'
import { addFilesToSpace } from '@/lib/server/spaces'
import type { SpaceFile } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { files, spaceName } = (await req.json()) as {
    files?: SpaceFile[]
    spaceName?: string
  }

  if (!files?.length) {
    return NextResponse.json({ error: 'files is required' }, { status: 400 })
  }

  const space = addFilesToSpace(params.slug, files, spaceName)
  if (!space) {
    return NextResponse.json({ error: 'Space not found' }, { status: 404 })
  }

  return NextResponse.json({ space, added: files.length })
}

import { NextRequest, NextResponse } from 'next/server'
import { createSpace, listSpaces, type SpaceFile } from '@/lib/server/spaces'

export async function GET() {
  return NextResponse.json({ spaces: listSpaces() })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, files, source } = body as {
    name: string
    files?: SpaceFile[]
    source?: string
  }

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const space = createSpace(name, { files, source: source ?? 'manual' })
  return NextResponse.json(space, { status: 200 })
}

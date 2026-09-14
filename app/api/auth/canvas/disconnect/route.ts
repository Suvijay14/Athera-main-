import { NextResponse } from 'next/server'
import { deleteCanvasTokens } from '@/lib/server/canvas'

export async function POST() {
  deleteCanvasTokens()
  return NextResponse.json({ connected: false })
}

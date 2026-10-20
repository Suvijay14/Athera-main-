import { NextRequest, NextResponse } from 'next/server'

import {
  exportWorkspaceCsvAction,
  exportWorkspaceJsonAction,
} from '@/app/workspace/account-actions'

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format')
  try {
    if (format === 'csv') {
      const { csv, filename } = await exportWorkspaceCsvAction()
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }
    if (format === 'json') {
      const { json, filename } = await exportWorkspaceJsonAction()
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }
    return NextResponse.json({ error: 'invalid_format' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'export_failed' }, { status: 500 })
  }
}

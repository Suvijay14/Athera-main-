import { legacyFilesystemApiEnabled } from '@/lib/legacy/filesystem-api'

export function GET() {
  return Response.json({ filesystemApi: legacyFilesystemApiEnabled() })
}

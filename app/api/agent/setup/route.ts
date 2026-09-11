import { NextResponse } from 'next/server'
import path from 'path'

export async function GET() {
  const repoRoot = path.resolve(process.cwd(), '..')
  const agentDir = path.join(repoRoot, 'athena-agent')

  const script = `#!/bin/bash
# Athena Agent — run with: bash setup-athena-agent.sh
# (Downloaded files cannot be double-clicked until chmod +x)

set -e
AGENT_DIR="${agentDir}"

if [ ! -d "$AGENT_DIR" ]; then
  echo "ERROR: athena-agent not found at $AGENT_DIR"
  echo "Make sure JARVIS repo is at ${repoRoot}"
  exit 1
fi

cd "$AGENT_DIR"
chmod +x setup.command scripts/install.sh 2>/dev/null || true
bash scripts/install.sh
`

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/x-sh',
      'Content-Disposition': 'attachment; filename="setup-athena-agent.sh"',
    },
  })
}

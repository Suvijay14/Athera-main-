export type ParseCsvResult = {
  headers: string[]
  rows: string[][]
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (inQuotes) {
      current += c
    } else if (c === ',') {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

export async function parseCsvFile(file: File): Promise<ParseCsvResult> {
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line)
    while (cells.length < headers.length) cells.push('')
    return cells.slice(0, headers.length)
  })
  return { headers, rows }
}

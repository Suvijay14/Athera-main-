'use client'

import { useCallback, useState } from 'react'
import { Upload } from 'lucide-react'

import { parseCsvFile } from '@/lib/documents/parseCsvFile'

const STORAGE_KEY = 'athera_lab_import_preview'

type MapKey = 'name' | 'role' | 'email' | 'phone' | 'notes'

export default function ImportCardLab() {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<MapKey, number>>({
    name: 0,
    role: -1,
    email: -1,
    phone: -1,
    notes: -1,
  })
  const [step, setStep] = useState<'select' | 'mapping' | 'done'>('select')
  const [error, setError] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState(0)

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setError(null)
    try {
      const { headers: h, rows: r } = await parseCsvFile(f)
      if (!h.length) {
        setError('CSV appears empty. Include a header row.')
        return
      }
      setHeaders(h)
      setRows(r)
      setMapping({
        name: h.findIndex((x) => /name|member|person/.test(x)) ?? 0,
        role: h.findIndex((x) => /role|title|job/.test(x)),
        email: h.findIndex((x) => /email|e-mail/.test(x)),
        phone: h.findIndex((x) => /phone|tel|mobile/.test(x)),
        notes: h.findIndex((x) => /note|comment/.test(x)),
      })
      setStep('mapping')
    } catch {
      setError('Could not read file. Use a UTF-8 CSV.')
    }
  }, [])

  const previewRows = rows.slice(0, 5).map((row) => ({
    name: mapping.name >= 0 ? row[mapping.name]?.trim() : '',
    role: mapping.role >= 0 ? row[mapping.role]?.trim() : '',
    email: mapping.email >= 0 ? row[mapping.email]?.trim() : '',
  }))

  const confirmImport = useCallback(() => {
    const members = rows
      .map((row) => ({
        name: mapping.name >= 0 ? row[mapping.name]?.trim() : '',
        role: mapping.role >= 0 ? row[mapping.role]?.trim() : '',
        email: mapping.email >= 0 ? row[mapping.email]?.trim() : '',
        phone: mapping.phone >= 0 ? row[mapping.phone]?.trim() : '',
        notes: mapping.notes >= 0 ? row[mapping.notes]?.trim() : '',
      }))
      .filter((m) => m.name)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ importedAt: new Date().toISOString(), members }))
    } catch {
      /* ignore */
    }
    setImportedCount(members.length)
    setStep('done')
  }, [mapping, rows])

  return (
    <div className="space-y-4">
      <p className="text-body-sm text-secondary">
        Lab port of CTC Import card — parse CSV, map columns, preview rows. Saves preview to localStorage (
        <code className="text-xs">{STORAGE_KEY}</code>).
      </p>

      {step === 'select' && (
        <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-border-serenity rounded-xl p-8 cursor-pointer hover:bg-surface-container-low">
          <Upload className="text-primary" size={28} />
          <span className="text-sm font-medium text-on-surface">Choose CSV file</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={onFileChange} />
        </label>
      )}

      {step === 'mapping' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {(Object.keys(mapping) as MapKey[]).map((key) => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-secondary capitalize">{key}</span>
                <select
                  className="rounded-lg border border-border-serenity bg-surface-container-lowest px-2 py-1.5"
                  value={mapping[key]}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [key]: Number(e.target.value) }))
                  }
                >
                  <option value={-1}>— skip —</option>
                  {headers.map((h, i) => (
                    <option key={h + i} value={i}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-border-serenity">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-serenity text-left text-secondary">
                  <th className="p-2">Name</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={i} className="border-b border-border-serenity/60">
                    <td className="p-2">{r.name || '—'}</td>
                    <td className="p-2">{r.role || '—'}</td>
                    <td className="p-2">{r.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-body-sm text-secondary">{rows.length} rows detected (showing first 5)</p>
          <button
            type="button"
            onClick={confirmImport}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium"
          >
            Confirm import (lab)
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="rounded-xl bg-surface-container-low p-4 text-body-sm">
          Imported <strong>{importedCount}</strong> members to lab storage. Open{' '}
          <strong>Document library (lab)</strong> to see the list.
          <button
            type="button"
            className="block mt-3 text-primary underline"
            onClick={() => setStep('select')}
          >
            Import another file
          </button>
        </div>
      )}

      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  )
}

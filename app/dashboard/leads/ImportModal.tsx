'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import Papa from 'papaparse'

interface Props { onClose: () => void; onImported: () => void }

export function ImportModal({ onClose, onImported }: Props) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<{ successful: number; failed: number; total: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRows(results.data)
        setPreview(results.data.slice(0, 3))
      },
    })
  }

  async function handleImport() {
    if (rows.length === 0) return
    setLoading(true)
    const res = await fetch('/api/leads/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, fileName }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      toast(data.error || 'Import failed', 'error')
      return
    }
    setResult(data)
    toast(`Imported ${data.successful} leads!`)
    onImported()
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-white font-bold text-lg">Import CSV</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-400 text-sm">Required columns: <code className="bg-slate-900 px-1 rounded text-blue-300 text-xs">business_name, niche, city, state</code></p>
          <p className="text-slate-500 text-xs">Optional: zip_code, website_url, email, phone, google_rating, review_count, website_quality, has_clear_cta, has_quote_form, seo_notes, notes</p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            {fileName ? `📄 ${fileName}` : 'Choose CSV File'}
          </Button>
          {preview.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs mb-2">Preview ({rows.length} rows):</p>
              <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto text-xs text-slate-300">
                <pre>{JSON.stringify(preview[0], null, 2)}</pre>
              </div>
            </div>
          )}
          {result && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-sm">
              <p className="text-green-300">✓ Imported {result.successful}/{result.total} leads. {result.failed > 0 && `${result.failed} failed.`}</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={handleImport} disabled={loading || rows.length === 0}>
              {loading ? 'Importing...' : `Import ${rows.length > 0 ? rows.length + ' rows' : ''}`}
            </Button>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

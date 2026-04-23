'use client'
import { useRef, useState } from 'react'
import { Upload, Loader2, X } from 'lucide-react'

interface Props {
  value: string
  onChange: (url: string) => void
  bucket?: string
  folder?: string
  className?: string
}

export function ImageUploadButton({ value, onChange, bucket = 'market-images', folder = 'covers', className = '' }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Máximo 5MB'); return }
    setUploading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', bucket)
      fd.append('folder', folder)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onChange(data.url)
    } catch (e: any) { setError(e.message) }
    setUploading(false)
    if (ref.current) ref.current.value = ''
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="URL da imagem ou faça upload →"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
        />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-card border border-border text-muted-foreground px-3 py-2 text-xs font-medium hover:border-primary/40 hover:text-foreground disabled:opacity-50 transition-colors"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*,image/gif" className="hidden" onChange={handleFile} />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {value && (
        <div className="relative">
          <img src={value} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-border" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

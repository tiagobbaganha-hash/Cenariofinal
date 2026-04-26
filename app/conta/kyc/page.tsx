'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield, CheckCircle, Loader2, Upload, AlertCircle, Camera, FileText, User, Clock } from 'lucide-react'

type KycStatus = 'not_started' | 'pending' | 'approved' | 'rejected'

function validateCPF(cpf: string): boolean {
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i)
  let rev = 11 - (sum % 11)
  if (rev >= 10) rev = 0
  if (rev !== parseInt(c[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i)
  rev = 11 - (sum % 11)
  if (rev >= 10) rev = 0
  return rev === parseInt(c[10])
}

function calcAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function KycPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<KycStatus>('not_started')
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [form, setForm] = useState({ full_name: '', cpf: '', birth_date: '', phone: '' })
  const [docFront, setDocFront] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [docFrontPreview, setDocFrontPreview] = useState('')
  const [selfiePreview, setSelfiePreview] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setUserEmail(user.email || '')
      createClient().from('profiles')
        .select('full_name, cpf, birth_date, phone, kyc_status')
        .eq('id', user.id).single()
        .then(({ data: p }) => {
          if (p) {
            setStatus((p.kyc_status as KycStatus) || 'not_started')
            setForm({ full_name: p.full_name || '', cpf: p.cpf || '', birth_date: p.birth_date || '', phone: p.phone || '' })
            if (p.kyc_status === 'pending' || p.kyc_status === 'approved') setStep(3)
          }
          setLoading(false)
        })
    })
  }, [router])

  async function submitStep1() {
    setError('')
    if (!form.full_name.trim()) { setError('Nome completo é obrigatório'); return }
    if (!validateCPF(form.cpf)) { setError('CPF inválido'); return }
    if (!form.birth_date) { setError('Data de nascimento é obrigatória'); return }
    const age = calcAge(form.birth_date)
    if (age < 18) { setError(`Você tem ${age} anos. Esta plataforma é exclusiva para maiores de 18 anos.`); return }
    if (!form.phone) { setError('Telefone é obrigatório'); return }
    setSaving(true)
    await createClient().from('profiles').update({
      full_name: form.full_name,
      cpf: form.cpf.replace(/\D/g, ''),
      birth_date: form.birth_date,
      phone: form.phone,
    }).eq('id', userId)
    setSaving(false)
    setStep(2)
  }

  async function compressImage(file: File): Promise<Blob> {
    return new Promise(res => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        const MAX = 1200
        let w = img.width, h = img.height
        if (w > MAX) { h = h * MAX / w; w = MAX }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        canvas.toBlob(b => res(b!), 'image/jpeg', 0.85)
      }
      img.src = url
    })
  }

  async function submitStep2() {
    setError('')
    if (!docFront) { setError('Envie a foto do documento (RG ou CNH)'); return }
    if (!selfie) { setError('Envie a selfie segurando o documento'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      // Upload documento
      const docBlob = await compressImage(docFront)
      const { error: e1 } = await supabase.storage.from('market-images')
        .upload(`kyc/${userId}_doc.jpg`, docBlob, { upsert: true, contentType: 'image/jpeg' })
      if (e1) throw new Error('Erro ao enviar documento: ' + e1.message)

      // Upload selfie
      const selfieBlob = await compressImage(selfie)
      const { error: e2 } = await supabase.storage.from('market-images')
        .upload(`kyc/${userId}_selfie.jpg`, selfieBlob, { upsert: true, contentType: 'image/jpeg' })
      if (e2) throw new Error('Erro ao enviar selfie: ' + e2.message)

      // URLs públicas
      const docUrl = supabase.storage.from('market-images').getPublicUrl(`kyc/${userId}_doc.jpg`).data.publicUrl
      const selfieUrl = supabase.storage.from('market-images').getPublicUrl(`kyc/${userId}_selfie.jpg`).data.publicUrl

      // Atualizar perfil
      await supabase.from('profiles').update({
        kyc_status: 'pending',
        kyc_doc_url: docUrl,
        kyc_selfie_url: selfieUrl,
        kyc_submitted_at: new Date().toISOString(),
      }).eq('id', userId)

      // Notificar admin via API
      await fetch('/api/kyc/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: userEmail, name: form.full_name, docUrl, selfieUrl })
      }).catch(() => {})

      setStatus('pending')
      setStep(3)
    } catch (e: any) {
      setError(e.message)
    }
    setSaving(false)
  }

  function handleFile(file: File, type: 'doc' | 'selfie') {
    const preview = URL.createObjectURL(file)
    if (type === 'doc') { setDocFront(file); setDocFrontPreview(preview) }
    else { setSelfie(file); setSelfiePreview(preview) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Verificação de Identidade</h1>
            <p className="text-sm text-muted-foreground">Obrigatória para saques • Aprovação em até 10 minutos</p>
          </div>
        </div>

        {/* Status aprovado */}
        {status === 'approved' && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
            <h2 className="text-lg font-bold text-green-400">✅ Identidade Verificada!</h2>
            <p className="text-sm text-muted-foreground">Sua conta está liberada para saques.</p>
          </div>
        )}

        {/* Status pendente */}
        {status === 'pending' && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center space-y-3">
            <Clock className="h-12 w-12 text-yellow-400 mx-auto animate-pulse" />
            <h2 className="text-lg font-bold text-yellow-400">⏳ Em análise</h2>
            <p className="text-sm text-muted-foreground">Documentos enviados. Aprovação em até <strong>10 minutos</strong>.</p>
            <p className="text-xs text-muted-foreground">Você receberá uma notificação quando for aprovado.</p>
          </div>
        )}

        {/* Status rejeitado */}
        {status === 'rejected' && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 space-y-3">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <h2 className="font-bold">Verificação não aprovada</h2>
            </div>
            <p className="text-sm text-muted-foreground">Tente novamente com documentos mais claros.</p>
            <button onClick={() => { setStatus('not_started'); setStep(1) }}
              className="text-sm text-primary hover:underline">
              Reenviar documentos →
            </button>
          </div>
        )}

        {/* Passos */}
        {(status === 'not_started' || status === 'rejected') && (
          <>
            {/* Indicador de passos */}
            <div className="flex items-center gap-2">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {s}
                  </div>
                  {s < 2 && <div className={`h-0.5 flex-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} style={{width: '60px'}} />}
                </div>
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                {step === 1 ? 'Dados pessoais' : 'Documentos'}
              </span>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Passo 1: Dados pessoais */}
            {step === 1 && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <h2 className="font-bold">Dados Pessoais</h2>
                </div>
                {[
                  { label: 'Nome completo (como no documento)', key: 'full_name', type: 'text', placeholder: 'Ex: João Silva Santos' },
                  { label: 'CPF', key: 'cpf', type: 'text', placeholder: '000.000.000-00' },
                  { label: 'Data de nascimento', key: 'birth_date', type: 'date', placeholder: '' },
                  { label: 'Telefone celular', key: 'phone', type: 'tel', placeholder: '(66) 99999-9999' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-sm font-medium block mb-1.5">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                ))}
                <button onClick={submitStep1} disabled={saving}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</> : 'Continuar →'}
                </button>
              </div>
            )}

            {/* Passo 2: Documentos */}
            {step === 2 && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h2 className="font-bold">Documentos</h2>
                </div>

                <div className="rounded-xl bg-muted/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
                  <p>📋 Aceitos: <strong>RG</strong> ou <strong>CNH</strong></p>
                  <p>📸 Fotos devem estar nítidas, sem cortes e sem reflexo</p>
                  <p>⏱️ Aprovação em até <strong>10 minutos</strong> em horário comercial</p>
                </div>

                {/* Upload Documento */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    📄 Frente do documento (RG ou CNH)
                  </label>
                  <label className={`block w-full rounded-xl border-2 border-dashed cursor-pointer transition-colors ${docFront ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], 'doc')} />
                    {docFrontPreview ? (
                      <img src={docFrontPreview} alt="Documento" className="w-full h-48 object-cover rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-8">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Toque para tirar foto ou carregar</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Upload Selfie */}
                <div>
                  <label className="text-sm font-medium block mb-2">
                    🤳 Selfie segurando o documento
                  </label>
                  <label className={`block w-full rounded-xl border-2 border-dashed cursor-pointer transition-colors ${selfie ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                    <input type="file" accept="image/*" capture="user" className="hidden"
                      onChange={e => e.target.files?.[0] && handleFile(e.target.files[0], 'selfie')} />
                    {selfiePreview ? (
                      <img src={selfiePreview} alt="Selfie" className="w-full h-48 object-cover rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-8">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Selfie com documento na mão</p>
                      </div>
                    )}
                  </label>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)}
                    className="flex-1 h-12 rounded-xl border border-border text-sm font-medium hover:border-primary/40 transition-colors">
                    ← Voltar
                  </button>
                  <button onClick={submitStep2} disabled={saving}
                    className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : '✅ Enviar para análise'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

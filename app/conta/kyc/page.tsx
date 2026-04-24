'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield, CheckCircle, Loader2, Upload, AlertCircle, User, FileText, Camera } from 'lucide-react'

type KycStatus = 'not_started' | 'pending' | 'approved' | 'rejected'

export default function KycPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<KycStatus>('not_started')
  const [step, setStep] = useState(1)
  const [msg, setMsg] = useState('')
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    full_name: '', cpf: '', birth_date: '', phone: '',
    address_city: '', address_state: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase.from('profiles')
        .select('full_name, cpf, birth_date, phone, address_city, address_state, kyc_status')
        .eq('id', user.id).single()

      if (profile) {
        setStatus((profile.kyc_status as KycStatus) || 'not_started')
        setForm({
          full_name: profile.full_name || '',
          cpf: profile.cpf || '',
          birth_date: profile.birth_date || '',
          phone: profile.phone || '',
          address_city: profile.address_city || '',
          address_state: profile.address_state || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function saveStep1() {
    if (!form.full_name || !form.cpf || !form.birth_date) {
      setMsg('❌ Preencha todos os campos obrigatórios')
      return
    }
    const cpfClean = form.cpf.replace(/\D/g, '')
    if (cpfClean.length !== 11) { setMsg('❌ CPF inválido'); return }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name, cpf: form.cpf, birth_date: form.birth_date,
      phone: form.phone, address_city: form.address_city, address_state: form.address_state,
    }).eq('id', userId)

    if (error) { setMsg('❌ ' + error.message) }
    else { setMsg(''); setStep(2) }
    setSaving(false)
  }

  async function submitKyc() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      kyc_status: 'pending',
    }).eq('id', userId)

    if (error) { setMsg('❌ ' + error.message) }
    else {
      setStatus('pending')
      setMsg('✅ Documentos enviados! Análise em até 24h.')
    }
    setSaving(false)
  }

  const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-4 ${
            status === 'approved' ? 'bg-green-500/20' :
            status === 'pending' ? 'bg-yellow-500/20' :
            status === 'rejected' ? 'bg-red-500/20' : 'bg-primary/20'
          }`}>
            {status === 'approved' ? <CheckCircle className="h-8 w-8 text-green-400" /> :
             status === 'rejected' ? <AlertCircle className="h-8 w-8 text-red-400" /> :
             <Shield className="h-8 w-8 text-primary" />}
          </div>
          <h1 className="text-2xl font-bold">Verificação de Identidade</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {status === 'approved' ? 'Identidade verificada! Você pode sacar livremente.' :
             status === 'pending' ? 'Documentos em análise. Retorno em até 24h.' :
             status === 'rejected' ? 'Verificação rejeitada. Reenvie seus dados.' :
             'Necessária para saques. Leva menos de 2 minutos.'}
          </p>
        </div>

        {/* Status aprovado */}
        {status === 'approved' && (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="font-bold text-green-400">KYC Aprovado ✅</p>
            <p className="text-sm text-muted-foreground mt-1">Sua identidade foi verificada com sucesso.</p>
          </div>
        )}

        {/* Status pendente */}
        {status === 'pending' && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 text-center">
            <Loader2 className="h-12 w-12 text-yellow-400 mx-auto mb-3 animate-spin" />
            <p className="font-bold text-yellow-400">Em análise</p>
            <p className="text-sm text-muted-foreground mt-1">Seus documentos estão sendo analisados. Retorno em até 24 horas.</p>
          </div>
        )}

        {/* Formulário */}
        {(status === 'not_started' || status === 'rejected') && (
          <>
            {/* Steps */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>{step > s ? '✓' : s}</div>
                  {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Dados pessoais */}
            {step === 1 && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-sm">Dados Pessoais</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Nome completo *</label>
                  <input className={inp} value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="Como no documento oficial" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">CPF *</label>
                    <input className={inp} value={form.cpf} onChange={e => setForm(f => ({...f, cpf: e.target.value}))} placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Data de nascimento *</label>
                    <input type="date" className={inp} value={form.birth_date} onChange={e => setForm(f => ({...f, birth_date: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Telefone</label>
                    <input className={inp} value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+55 (11) 99999-9999" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Estado</label>
                    <select className={inp} value={form.address_state} onChange={e => setForm(f => ({...f, address_state: e.target.value}))}>
                      <option value="">Selecione</option>
                      {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                {msg && <p className={`text-sm ${msg.startsWith('❌') ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>}
                <button onClick={saveStep1} disabled={saving}
                  className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Continuar →'}
                </button>
              </div>
            )}

            {/* Step 2: Documento */}
            {step === 2 && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-sm">Documento de Identidade</p>
                </div>
                <p className="text-xs text-muted-foreground">Envie uma foto clara do seu RG, CNH ou Passaporte. O documento deve estar válido e com todos os dados visíveis.</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Frente do documento', 'Verso do documento'].map(label => (
                    <div key={label} className="rounded-xl border-2 border-dashed border-border p-4 text-center cursor-pointer hover:border-primary/40 transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">JPG, PNG até 5MB</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">⚠️ Upload de documentos via integração Veriff (em breve). Por enquanto, envie pelo suporte.</p>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-border py-2.5 text-sm hover:bg-muted transition-colors">← Voltar</button>
                  <button onClick={() => setStep(3)} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Continuar →</button>
                </div>
              </div>
            )}

            {/* Step 3: Selfie + Confirmar */}
            {step === 3 && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-sm">Confirmar e Enviar</p>
                </div>
                <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-2 text-xs">
                  <p className="font-semibold">Revise seus dados:</p>
                  <p><span className="text-muted-foreground">Nome:</span> {form.full_name}</p>
                  <p><span className="text-muted-foreground">CPF:</span> {form.cpf}</p>
                  <p><span className="text-muted-foreground">Nascimento:</span> {form.birth_date ? new Date(form.birth_date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                  <p><span className="text-muted-foreground">Estado:</span> {form.address_state || '-'}</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
                  Ao enviar, você confirma que os dados são verdadeiros. Dados falsos resultam em bloqueio da conta conforme nossos Termos de Uso.
                </div>
                {msg && <p className={`text-sm ${msg.startsWith('❌') ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-border py-2.5 text-sm hover:bg-muted transition-colors">← Voltar</button>
                  <button onClick={submitKyc} disabled={saving}
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '✅ Enviar para análise'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Info */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-xs font-semibold">Por que verificamos sua identidade?</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>🔒 Segurança e prevenção de fraudes</li>
            <li>📋 Conformidade com Lei 14.790/2023</li>
            <li>💰 Obrigação de reter e recolher IR sobre prêmios</li>
            <li>🏦 Necessário para saques via PIX</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

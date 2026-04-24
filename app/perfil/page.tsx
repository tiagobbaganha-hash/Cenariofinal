'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  User, Phone, CreditCard, Calendar, MapPin, Shield,
  Upload, Check, Clock, X, ChevronRight, Camera,
  AlertTriangle, Loader2, ArrowLeft, Eye, EyeOff, Save
} from 'lucide-react'

const AVATARS = ['🚀','🐂','🦁','🔮','🎯','⚡','🌊','🔥','💎','🦅','🎲','🌙','☀️','🏆','⚔️','🦊','🐉','🌟','💫','🎪']





type Tab = 'perfil' | 'kyc' | 'apostas' | 'seguranca'

function TabBtn({ id, label, icon, active, onClick }: any) {
  return (
    <button onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
        active ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}>
      {icon} {label}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inp = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"

export default function PerfilPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('perfil')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Dados do perfil
  const [nome, setNome] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')

  // Endereço
  const [cep, setCep] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  // KYC
  const [kycStatus, setKycStatus] = useState<string>('not_started')
  const [docFrente, setDocFrente] = useState<File | null>(null)
  const [docVerso, setDocVerso] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [uploadingKyc, setUploadingKyc] = useState(false)
  const [kycSent, setKycSent] = useState(false)

  // Apostas
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, wins: 0, losses: 0, volume: 0, pnl: 0 })

  // Senha
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [changingPass, setChangingPass] = useState(false)
  const [passMsg, setPassMsg] = useState('')

  const frenteRef = useRef<HTMLInputElement>(null)
  const versoRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setSelectedAvatar(user.id.charCodeAt(0) % AVATARS.length)

      const { data: p } = await supabase.from('profiles').select('id, full_name, email, phone, cpf, birth_date, address, kyc_status, city, state').eq('id', user.id).single()
      if (p) {
        setNome((p as any).full_name || '')
        if ((p as any).avatar_url) setAvatarUrl((p as any).avatar_url)
        // username não existe, usar email
        setPhone((p as any).phone || '')
        setCpf((p as any).cpf || '')
        setBirthDate((p as any).birth_date || '')
        setKycStatus((p as any).kyc_status || 'not_started')
        const addr = (p as any).address || {}
        setCep(addr.cep || '')
        setRua(addr.rua || '')
        setNumero(addr.numero || '')
        setComplemento(addr.complemento || '')
        setBairro(addr.bairro || '')
        setCidade(addr.cidade || '')
        setEstado(addr.estado || '')
      }

      // Apostas
      const { data: ords } = await supabase.from('orders')
        .select('id, stake_amount, potential_payout, settlement_amount, status, created_at, option_id, market_id, market_options(label, markets(title, slug))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

      const o = ords || []
      const wins = o.filter((x: any) => x.status === 'settled_win')
      const losses = o.filter((x: any) => x.status === 'settled_loss')
      const volume = o.reduce((s: number, x: any) => s + parseFloat(x.stake_amount || 0), 0)
      const earned = wins.reduce((s: number, x: any) => s + parseFloat(x.settlement_amount || 0), 0)
      setOrders(o)
      setStats({ total: o.length, wins: wins.length, losses: losses.length, volume, pnl: earned - volume })
      setLoading(false)
    }
    load()
  }, [])

  async function salvarPerfil() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      full_name: nome,
      avatar_url: avatarUrl || null,
      phone,
      cpf: cpf.replace(/\D/g, ''),
      birth_date: birthDate || null,
      address: { cep, rua, numero, complemento, bairro, cidade, estado }
    }).eq('id', userId)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  async function buscarCep() {
    const c = cep.replace(/\D/g, '')
    if (c.length !== 8) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`)
      const d = await r.json()
      if (!d.erro) {
        setRua(d.logradouro || '')
        setBairro(d.bairro || '')
        setCidade(d.localidade || '')
        setEstado(d.uf || '')
      }
    } catch {}
  }

  async function enviarKyc() {
    if (!docFrente || !docVerso || !selfie) return
    setUploadingKyc(true)
    const supabase = createClient()
    try {
      for (const [file, name] of [[docFrente, 'frente'], [docVerso, 'verso'], [selfie, 'selfie']] as [File, string][]) {
        await supabase.storage.from('kyc-documents').upload(
          `${userId}/${name}.${file.name.split('.').pop()}`,
          file, { upsert: true }
        )
      }
      await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', userId)
      setKycStatus('pending')
      setKycSent(true)
    } catch (e: any) { alert(e.message) }
    setUploadingKyc(false)
  }

  async function alterarSenha() {
    if (!newPass || newPass !== confirmPass) {
      setPassMsg('As senhas não coincidem')
      return
    }
    if (newPass.length < 8) {
      setPassMsg('Mínimo 8 caracteres')
      return
    }
    setChangingPass(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) {
      setPassMsg(error.message)
    } else {
      setPassMsg('✅ Senha alterada com sucesso!')
      setCurrentPass(''); setNewPass(''); setConfirmPass('')
    }
    setChangingPass(false)
  }

  function formatCpf(v: string) {
    return v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14)
  }
  function formatPhone(v: string) {
    return v.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15)
  }
  function formatCep(v: string) {
    return v.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').slice(0, 9)
  }

  const kycCfg: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
    not_started: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'Não verificado', icon: <Shield className="h-4 w-4" /> },
    pending:     { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Em análise', icon: <Clock className="h-4 w-4" /> },
    approved:    { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Verificado ✓', icon: <Check className="h-4 w-4" /> },
    rejected:    { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Rejeitado', icon: <X className="h-4 w-4" /> },
  }
  const kyc = kycCfg[kycStatus] || kycCfg.not_started

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/conta" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-4xl border border-primary/20">
              {AVATARS[selectedAvatar]}
            </div>
            <div className={`absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${kyc.bg} ${kyc.color}`}>
              {kyc.icon}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{nome || 'Meu Perfil'}</h1>
            <p className="text-xs text-muted-foreground">{username ? `@${username}` : 'Configure seu username'}</p>
          </div>
        </div>
      </div>

      {/* Avatar selector */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Foto de Perfil</p>
        {/* Upload de foto real */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              : <div className="h-full w-full bg-primary/20 flex items-center justify-center text-3xl">{AVATARS[selectedAvatar]}</div>
            }
          </div>
          <div className="space-y-1.5">
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm hover:border-primary/40 hover:text-primary transition-colors">
              <Camera className="h-4 w-4" />
              {uploadingPhoto ? 'Enviando...' : 'Carregar foto'}
              <input type="file" accept="image/*" className="hidden" disabled={uploadingPhoto}
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploadingPhoto(true)
                  const url = await uploadFoto(file)
                  if (url) setAvatarUrl(url)
                  setUploadingPhoto(false)
                }} />
            </label>
            {avatarUrl && <button onClick={() => setAvatarUrl('')} className="text-xs text-destructive hover:underline">Remover foto</button>}
          </div>
        </div>
        {/* Avatar emoji (alternativo) */}
        <p className="text-xs text-muted-foreground">Ou escolha um avatar emoji:</p>
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((emoji, i) => (
            <button key={i} onClick={() => { setSelectedAvatar(i); setAvatarUrl('') }}
              className={`text-2xl p-1.5 rounded-xl transition-all hover:scale-110 ${i === selectedAvatar && !avatarUrl ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-accent'}`}>
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <TabBtn id="perfil" label="Dados Pessoais" icon={<User className="h-3.5 w-3.5" />} active={tab === 'perfil'} onClick={setTab} />
        <TabBtn id="kyc" label="Verificação" icon={<Shield className="h-3.5 w-3.5" />} active={tab === 'kyc'} onClick={setTab} />
        <TabBtn id="apostas" label="Apostas" icon={<CreditCard className="h-3.5 w-3.5" />} active={tab === 'apostas'} onClick={setTab} />
        <TabBtn id="seguranca" label="Segurança" icon={<Eye className="h-3.5 w-3.5" />} active={tab === 'seguranca'} onClick={setTab} />
      </div>

      {/* ── TAB DADOS PESSOAIS ── */}
      {tab === 'perfil' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <p className="text-sm font-bold text-foreground">Informações básicas</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome completo">
                <input className={inp} value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" />
              </Field>

              <Field label="CPF">
                <input className={inp} value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" />
              </Field>
              <Field label="Telefone">
                <input className={inp} value={phone} onChange={e => setPhone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" inputMode="numeric" />
              </Field>
              <Field label="Data de nascimento">
                <input type="date" className={inp} value={birthDate} onChange={e => setBirthDate(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <p className="text-sm font-bold text-foreground">Endereço</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="CEP">
                <div className="flex gap-2">
                  <input className={inp} value={cep} onChange={e => setCep(formatCep(e.target.value))} onBlur={buscarCep} placeholder="00000-000" inputMode="numeric" />
                  <button onClick={buscarCep} className="rounded-xl border border-border bg-background px-3 text-xs text-primary hover:bg-accent transition-colors whitespace-nowrap">Buscar</button>
                </div>
              </Field>
              <Field label="Estado">
                <input className={inp} value={estado} onChange={e => setEstado(e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" />
              </Field>
              <Field label="Rua / Logradouro">
                <input className={inp} value={rua} onChange={e => setRua(e.target.value)} placeholder="Rua das Flores" />
              </Field>
              <Field label="Número">
                <input className={inp} value={numero} onChange={e => setNumero(e.target.value)} placeholder="123" />
              </Field>
              <Field label="Complemento">
                <input className={inp} value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Apto 42" />
              </Field>
              <Field label="Bairro">
                <input className={inp} value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Centro" />
              </Field>
              <Field label="Cidade" >
                <input className={inp} value={cidade} onChange={e => setCidade(e.target.value)} placeholder="São Paulo" />
              </Field>
            </div>
          </div>

          <button onClick={salvarPerfil} disabled={saving}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all ${
              saved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar alterações'}
          </button>
        </div>
      )}

      {/* ── TAB KYC ── */}
      {tab === 'kyc' && (
        <div className="space-y-4">
          {/* Status atual */}
          <div className={`rounded-2xl border p-5 flex items-center gap-4 ${kycStatus === 'approved' ? 'border-green-500/30 bg-green-500/10' : kycStatus === 'pending' ? 'border-yellow-500/30 bg-yellow-500/10' : kycStatus === 'rejected' ? 'border-red-500/30 bg-red-500/10' : 'border-border bg-card'}`}>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${kyc.bg}`}> 
              {kycStatus === 'approved' ? '✅' : kycStatus === 'pending' ? '⏳' : kycStatus === 'rejected' ? '❌' : '🆔'}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-bold ${kyc.color}`}>{kyc.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {kycStatus === 'not_started' && 'Verifique sua identidade para sacar e aumentar limites'}
                {kycStatus === 'pending' && 'Documentos enviados. Análise em até 24h úteis.'}
                {kycStatus === 'approved' && 'Identidade verificada. Todos os recursos desbloqueados!'}
                {kycStatus === 'rejected' && 'Documentos rejeitados. Reenvie fotos mais nítidas.'}
              </p>
            </div>
          </div>

          {kycStatus === 'approved' ? (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 text-center space-y-2">
              <p className="text-4xl">🎉</p>
              <p className="text-sm font-bold text-green-400">Conta totalmente verificada!</p>
              <p className="text-xs text-muted-foreground">Você pode sacar sem limites e tem acesso a todos os recursos.</p>
            </div>
          ) : kycSent ? (
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center space-y-2">
              <p className="text-4xl">📤</p>
              <p className="text-sm font-bold text-yellow-400">Documentos enviados!</p>
              <p className="text-xs text-muted-foreground">Nossa equipe vai analisar em até 24h úteis.</p>
            </div>
          ) : (
            <>
              {/* Benefícios */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <p className="text-sm font-bold text-foreground">Por que verificar?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: '💸', label: 'Saques PIX sem limite' },
                    { icon: '🏆', label: 'Apostas maiores' },
                    { icon: '🛡️', label: 'Conta protegida' },
                    { icon: '⚡', label: 'Créditos mais rápidos' },
                  ].map(b => (
                    <div key={b.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{b.icon}</span><span>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload documentos */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <p className="text-sm font-bold text-foreground">Envie seus documentos</p>
                <p className="text-xs text-muted-foreground">RG, CNH ou Passaporte — frente e verso + selfie segurando o documento</p>

                {[
                  { label: 'Documento (frente)', file: docFrente, ref: frenteRef, set: setDocFrente, icon: '📄' },
                  { label: 'Documento (verso)', file: docVerso, ref: versoRef, set: setDocVerso, icon: '📄' },
                  { label: 'Selfie com documento', file: selfie, ref: selfieRef, set: setSelfie, icon: '🤳' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground mb-2">{item.label}</p>
                    <input type="file" ref={item.ref} accept="image/*" className="hidden"
                      onChange={e => item.set(e.target.files?.[0] || null)} />
                    <button onClick={() => item.ref.current?.click()}
                      className={`w-full flex items-center justify-center gap-3 rounded-xl border-2 border-dashed py-4 text-sm transition-colors ${
                        item.file ? 'border-primary/50 bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      }`}>
                      <span className="text-2xl">{item.file ? '✅' : item.icon}</span>
                      <span>{item.file ? item.file.name : `Clique para anexar`}</span>
                    </button>
                  </div>
                ))}

                <button
                  onClick={enviarKyc}
                  disabled={!docFrente || !docVerso || !selfie || uploadingKyc}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
                  {uploadingKyc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadingKyc ? 'Enviando...' : 'Enviar para verificação'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB APOSTAS ── */}
      {tab === 'apostas' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total de apostas', value: stats.total.toString(), icon: '🎯' },
              { label: 'Vitórias', value: stats.wins.toString(), icon: '🏆' },
              { label: 'Volume apostado', value: formatCurrency(stats.volume), icon: '💰' },
              { label: 'P&L', value: formatCurrency(stats.pnl), icon: stats.pnl >= 0 ? '📈' : '📉', color: stats.pnl >= 0 ? 'text-primary' : 'text-destructive' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-lg mb-1">{s.icon}</p>
                <p className={`text-xl font-black ${(s as any).color || 'text-foreground'}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Lista apostas */}
          <div className="space-y-2">
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Nenhuma aposta ainda
              </div>
            ) : orders.map((o: any) => {
              const opt = o.market_options
              const mkt = opt?.markets
              const isWin = o.status === 'settled_win'
              const isLoss = o.status === 'settled_loss'
              const isOpen = ['open','pending'].includes(o.status)
              return (
                <div key={o.id} className={`rounded-2xl border p-4 flex items-start gap-3 ${isWin ? 'border-primary/20 bg-primary/5' : isLoss ? 'border-destructive/20 bg-destructive/5' : 'border-border bg-card'}`}>
                  <div className="text-xl flex-shrink-0">{isWin ? '🏆' : isLoss ? '❌' : '⏳'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{mkt?.title || 'Mercado'}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Opção: {opt?.label || '—'}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">{formatCurrency(parseFloat(o.stake_amount))}</p>
                    {isWin && <p className="text-[10px] text-primary font-bold">+{formatCurrency(parseFloat(o.settlement_amount || 0))}</p>}
                    {isOpen && <p className="text-[10px] text-muted-foreground">Em aberto</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TAB SEGURANÇA ── */}
      {tab === 'seguranca' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <p className="text-sm font-bold text-foreground">Alterar senha</p>
            <Field label="Nova senha">
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className={inp + " pr-10"} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Mínimo 8 caracteres" />
                <button onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirmar nova senha">
              <input type={showPass ? 'text' : 'password'} className={inp} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Repita a senha" />
            </Field>
            {newPass && (
              <div className="space-y-1">
                {[
                  { ok: newPass.length >= 8, label: 'Mínimo 8 caracteres' },
                  { ok: /[A-Z]/.test(newPass), label: 'Uma letra maiúscula' },
                  { ok: /[0-9]/.test(newPass), label: 'Um número' },
                  { ok: newPass === confirmPass && newPass.length > 0, label: 'Senhas coincidem' },
                ].map(r => (
                  <div key={r.label} className={`flex items-center gap-2 text-xs ${r.ok ? 'text-primary' : 'text-muted-foreground'}`}>
                    <span>{r.ok ? '✓' : '○'}</span><span>{r.label}</span>
                  </div>
                ))}
              </div>
            )}
            {passMsg && <p className={`text-xs font-medium ${passMsg.includes('✅') ? 'text-primary' : 'text-destructive'}`}>{passMsg}</p>}
            <button onClick={alterarSenha} disabled={changingPass || !newPass || newPass !== confirmPass || newPass.length < 8}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
              {changingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Alterar senha
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm font-bold text-foreground">Sessões ativas</p>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <span className="text-xl">📱</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">Sessão atual</p>
                <p className="text-[10px] text-muted-foreground">Conectado agora</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>
          </div>

          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 space-y-3">
            <p className="text-sm font-bold text-destructive">Zona de perigo</p>
            <p className="text-xs text-muted-foreground">Estas ações são permanentes e não podem ser desfeitas.</p>
            <button className="w-full rounded-xl border border-destructive/30 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">
              Encerrar todas as sessões
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

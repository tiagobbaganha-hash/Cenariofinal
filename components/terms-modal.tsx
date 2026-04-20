'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Shield, CheckCircle, Loader2 } from 'lucide-react'

export function TermsModal() {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [age, setAge] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      // Verificar se já aceitou os termos
      supabase.from('profiles')
        .select('accepted_terms_at, onboarding_completed')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          // Mostrar modal se nunca aceitou os termos (mas já completou onboarding)
          // ou se aceitou há mais de 1 ano (atualização de termos)
          if (data?.onboarding_completed && !data?.accepted_terms_at) {
            setShow(true)
          }
        })
        .catch(() => {})
    })
  }, [])

  async function handleAccept() {
    if (!acceptedTerms || !acceptedPrivacy || !age) return
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('profiles').update({
        accepted_terms_at: new Date().toISOString(),
      }).eq('id', userId!)
      setShow(false)
    } catch (_) {}
    finally { setSaving(false) }
  }

  if (!show) return null

  const canAccept = acceptedTerms && acceptedPrivacy && age

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary/10 border-b border-border px-6 py-5 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/20 mb-3">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Termos de Uso do CenárioX</h2>
          <p className="text-xs text-muted-foreground mt-1">Atualizado em Abril de 2026</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ao usar o CenárioX, você confirma que está em conformidade com as leis do seu país, incluindo as referentes a mercados preditivos.
          </p>

          <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p>O CenárioX é uma plataforma de mercados preditivos para fins de entretenimento e análise. Não constitui serviço financeiro regulado.</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p>Você é responsável por verificar a legalidade da participação em mercados preditivos na sua jurisdição.</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p>Em caso de dúvida, consulte um advogado antes de usar a plataforma.</p>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            {[
              { state: age, setter: setAge, label: 'Confirmo que tenho 18 anos ou mais' },
              { state: acceptedTerms, setter: setAcceptedTerms, label: <>Li e aceito os <a href="/p/termos" target="_blank" className="text-primary hover:underline">Termos de Uso</a></> },
              { state: acceptedPrivacy, setter: setAcceptedPrivacy, label: <>Li e aceito a <a href="/p/privacidade" target="_blank" className="text-primary hover:underline">Política de Privacidade</a></> },
            ].map((item, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${item.state ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/50'}`}
                  onClick={() => item.setter(v => !v)}>
                  {item.state && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span className="text-sm text-muted-foreground leading-snug">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleAccept}
            disabled={!canAccept || saving}
            className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${canAccept ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Concordar e Continuar'}
          </button>
          <p className="text-center text-xs text-muted-foreground/60 mt-3">
            Ao continuar, você confirma que não está em uma jurisdição restrita.
          </p>
        </div>
      </div>
    </div>
  )
}

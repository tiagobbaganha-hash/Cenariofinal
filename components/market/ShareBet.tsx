'use client'

import { useState } from 'react'
import { Share2, Copy, Check, MessageCircle, Send } from 'lucide-react'

interface Props {
  marketTitle: string
  marketSlug: string
  optionLabel: string
  probability: number
  stake?: number
  isWin?: boolean
}

export function ShareBet({ marketTitle, marketSlug, optionLabel, probability, stake, isWin }: Props) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const url = `https://cenariox.com.br/mercados/${marketSlug}`
  const prob = Math.round(probability * 100)

  const whatsappText = isWin
    ? `🏆 Acertei no CenárioX!\n\nPrevii "${optionLabel}" no mercado:\n"${marketTitle}"\n\nGanho confirmado! Junte-se à plataforma de mercados preditivos do Brasil:\n${url}`
    : `🎯 Estou apostando no CenárioX!\n\nMinha previsão: "${optionLabel}" (${prob}% de chance)\nMercado: "${marketTitle}"\n\nFaça a sua previsão também:\n${url}`

  const instagramText = isWin
    ? `🏆 ACERTEI! Prevei "${optionLabel}" no mercado "${marketTitle}" e ganhei no CenárioX! Link na bio. #mercadopreditivo #cenariox`
    : `🎯 Minha previsão: "${optionLabel}" no mercado "${marketTitle}". Vamos ver! #cenariox #mercadopreditivo`

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-card/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
        <Share2 className="h-3.5 w-3.5" />
        Compartilhar
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-64 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold text-foreground">Compartilhar previsão</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">"{marketTitle}"</p>
            </div>
            <div className="p-2 space-y-1">
              {/* WhatsApp */}
              <a href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent/50 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-lg">
                  💬
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">WhatsApp</p>
                  <p className="text-[10px] text-muted-foreground">Enviar para contatos</p>
                </div>
              </a>

              {/* Telegram */}
              <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent/50 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-lg">
                  ✈️
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Telegram</p>
                  <p className="text-[10px] text-muted-foreground">Compartilhar no grupo</p>
                </div>
              </a>

              {/* Twitter/X */}
              <a href={`https://x.com/intent/tweet?text=${encodeURIComponent(instagramText)}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent/50 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-500/20 text-lg font-bold text-slate-300 text-sm">
                  𝕏
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Twitter / X</p>
                  <p className="text-[10px] text-muted-foreground">Postar tweet</p>
                </div>
              </a>

              {/* Copiar link */}
              <button onClick={copyLink}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-accent/50 transition-colors">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-muted'}`}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">{copied ? 'Link copiado!' : 'Copiar link'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{url}</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

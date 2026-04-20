'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  MessageCircle, X, Send, Loader2, ChevronDown,
  CheckCircle, Clock, Minimize2
} from 'lucide-react'

interface Message {
  id: string
  sender_type: 'user' | 'support'
  message: string
  created_at: string
  read_at: string | null
}

const WELCOME = `Olá! 👋 Bem-vindo ao suporte do CenárioX.

Como podemos ajudar você hoje? Descreva seu problema ou dúvida e nossa equipe responderá em breve.

⏱️ Tempo médio de resposta: **2-4 horas** em dias úteis.`

const AUTO_REPLIES: Record<string, string> = {
  'deposito': 'Para depósitos via PIX, acesse **Carteira → Depositar**. O saldo cai em até 5 minutos após o pagamento.',
  'saque': 'Saques são processados em até 24h úteis. Mínimo de R$ 20,00. Acesse **Carteira → Sacar**.',
  'aposta': 'Para apostar, abra qualquer mercado, escolha uma opção e confirme o valor. Dúvidas específicas? Me conte mais!',
  'senha': 'Para redefinir a senha, use a opção **"Esqueci a senha"** na tela de login. Você receberá um e-mail.',
  'cancelar': 'Cancelamentos de apostas não são possíveis após confirmação. Mas você pode **vender sua posição** na aba "Vender" do widget de aposta.',
}

function getAutoReply(msg: string): string | null {
  const lower = msg.toLowerCase()
  for (const [key, reply] of Object.entries(AUTO_REPLIES)) {
    if (lower.includes(key)) return reply
  }
  return null
}

function renderBold(text: string) {
  return text.split(/\*\*(.+?)\*\*/).map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
  )
}

export function SupportChat() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [step, setStep] = useState<'welcome' | 'form' | 'chat'>('welcome')
  const [userId, setUserId] = useState<string | null>(null)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        setEmail(user.email || '')
        // Verificar se já tem ticket aberto
        supabase.from('support_tickets')
          .select('id, status')
          .eq('user_id', user.id)
          .in('status', ['open', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
          .then(({ data }) => {
            if (data) {
              setTicketId(data.id)
              setStep('chat')
              loadMessages(data.id)
            }
          })
          .catch(() => {})
      }
    })
  }, [])

  async function loadMessages(tid: string) {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', tid)
      .order('created_at', { ascending: true })
    if (data) setMessages(data as Message[])
  }

  useEffect(() => {
    if (!ticketId) return
    const channel = supabase
      .channel(`support:${ticketId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${ticketId}`
      }, (payload) => {
        const msg = payload.new as Message
        setMessages(prev => [...prev, msg])
        if (!open || minimized) setUnread(u => u + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ticketId, open, minimized])

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setUnread(0)
    }
  }, [messages, open, minimized])

  async function createTicket() {
    if (!subject.trim()) return
    setLoading(true)
    try {
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({ user_id: userId, email, subject, status: 'open' })
        .select().single()
      if (error) throw error
      setTicketId(ticket.id)

      // Mensagem inicial do usuário
      await supabase.from('support_messages').insert({
        ticket_id: ticket.id,
        sender_type: 'user',
        sender_id: userId,
        message: subject,
      })

      // Auto-resposta inteligente
      const autoReply = getAutoReply(subject)
      await supabase.from('support_messages').insert({
        ticket_id: ticket.id,
        sender_type: 'support',
        message: autoReply
          ? `${autoReply}\n\nCaso isso não resolva, nossa equipe irá analisar e retornar em breve! 🙂`
          : `Recebemos sua mensagem sobre **"${subject}"**.\n\nUm agente de suporte irá responder em até 4 horas úteis. Fique à vontade para adicionar mais detalhes abaixo.`,
      })

      setStep('chat')
      loadMessages(ticket.id)
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!text.trim() || !ticketId) return
    const content = text.trim()
    setSending(true)
    setText('')
    try {
      await supabase.from('support_messages').insert({
        ticket_id: ticketId,
        sender_type: 'user',
        sender_id: userId,
        message: content,
      })
      // Auto-reply se match
      const autoReply = getAutoReply(content)
      if (autoReply) {
        setTimeout(async () => {
          await supabase.from('support_messages').insert({
            ticket_id: ticketId,
            sender_type: 'support',
            message: autoReply,
          })
        }, 1200)
      }
    } finally {
      setSending(false)
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Widget flutuante */}
      {open && !minimized && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm shadow-2xl rounded-2xl overflow-hidden border border-border flex flex-col bg-card"
          style={{ height: '480px' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-primary/10 border-b border-border">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 flex-shrink-0">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Suporte CenárioX</p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-muted-foreground">Online · responde em ~4h</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setMinimized(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Step: Welcome */}
          {step === 'welcome' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="rounded-2xl bg-muted/60 rounded-tl-sm p-3 text-sm text-muted-foreground leading-relaxed">
                {WELCOME.split('\n').map((line, i) => (
                  <p key={i} className={line === '' ? 'h-2' : 'mb-1'}>{renderBold(line)}</p>
                ))}
              </div>
              <button
                onClick={() => setStep('form')}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Iniciar conversa
              </button>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Respostas rápidas:</p>
                {['Como depositar?', 'Problema com saque', 'Cancelar aposta', 'Redefinir senha'].map(q => (
                  <button key={q} onClick={() => { setSubject(q); setStep('form') }}
                    className="w-full text-left rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors">
                    {q} →
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Form */}
          {step === 'form' && (
            <div className="flex-1 p-4 space-y-4">
              <p className="text-sm text-muted-foreground">Descreva brevemente o que precisa:</p>
              {!userId && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Seu e-mail</label>
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Assunto / Mensagem</label>
                <textarea value={subject} onChange={e => setSubject(e.target.value)}
                  rows={4} placeholder="Ex: Meu depósito não caiu, fiz o PIX às 14h..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <button onClick={createTicket} disabled={!subject.trim() || loading}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar mensagem'}
              </button>
              <button onClick={() => setStep('welcome')} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                ← Voltar
              </button>
            </div>
          )}

          {/* Step: Chat */}
          {step === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isUser = msg.sender_type === 'user'
                    const showTime = i === messages.length - 1 || messages[i+1]?.sender_type !== msg.sender_type
                    return (
                      <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          isUser ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                        }`}>
                          {msg.message.split('\n').map((line, li) =>
                            line ? <p key={li}>{renderBold(line)}</p> : <div key={li} className="h-1.5" />
                          )}
                        </div>
                        {showTime && (
                          <div className={`flex items-center gap-1 mt-0.5 mx-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[9px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                            {isUser && <CheckCircle className="h-2.5 w-2.5 text-muted-foreground" />}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border p-3 flex gap-2">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button onClick={sendMessage} disabled={!text.trim() || sending}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border/50 text-center">
            <span className="text-[10px] text-muted-foreground/50">Powered by CenárioX Support</span>
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => { setOpen(v => !v); setMinimized(false); setUnread(0) }}
        className="fixed bottom-4 right-4 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
        title="Suporte"
      >
        {open && !minimized ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
        )}
      </button>
    </>
  )
}

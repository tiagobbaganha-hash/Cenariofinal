'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Clock, CheckCircle, Loader2, Send, RefreshCw } from 'lucide-react'

interface Ticket {
  id: string
  user_id: string | null
  email: string | null
  subject: string | null
  status: string
  created_at: string
  unread: number
}

interface Message {
  id: string
  sender_type: string
  message: string
  created_at: string
}

const STATUS_COLOR: Record<string, string> = {
  open: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  in_progress: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  resolved: 'text-green-400 bg-green-500/10 border-green-500/20',
  closed: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
}

export default function SuportePage() {
  const supabase = createClient()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('support_tickets')
      .select('*, support_messages(count)')
      .order('created_at', { ascending: false })
      .limit(50)
    setTickets((data || []).map((t: any) => ({ ...t, unread: 0 })))
    setLoading(false)
  }

  async function selectTicket(ticket: Ticket) {
    setSelected(ticket)
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    if (ticket.status === 'open') {
      await supabase.from('support_tickets').update({ status: 'in_progress' }).eq('id', ticket.id)
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'in_progress' } : t))
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await supabase.from('support_messages').insert({
        ticket_id: selected.id,
        sender_type: 'support',
        message: reply.trim(),
      })
      setReply('')
      const { data } = await supabase.from('support_messages').select('*').eq('ticket_id', selected.id).order('created_at', { ascending: true })
      setMessages(data || [])
    } finally { setSending(false) }
  }

  async function resolve() {
    if (!selected) return
    await supabase.from('support_tickets').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', selected.id)
    setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'resolved' } : t))
    setSelected(s => s ? { ...s, status: 'resolved' } : s)
  }

  const open = tickets.filter(t => ['open', 'in_progress'].includes(t.status))
  const resolved = tickets.filter(t => ['resolved', 'closed'].includes(t.status))

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Suporte</h1>
          {open.length > 0 && <span className="rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5">{open.length} abertos</span>}
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Lista de tickets */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : tickets.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">Nenhum ticket ainda</div>
          ) : (
            <>
              {open.length > 0 && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Abertos ({open.length})</p>}
              {open.map(t => <TicketCard key={t.id} ticket={t} selected={selected?.id === t.id} onClick={() => selectTicket(t)} />)}
              {resolved.length > 0 && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3">Resolvidos</p>}
              {resolved.map(t => <TicketCard key={t.id} ticket={t} selected={selected?.id === t.id} onClick={() => selectTicket(t)} />)}
            </>
          )}
        </div>

        {/* Chat do ticket selecionado */}
        {selected ? (
          <div className="rounded-2xl border border-border bg-card flex flex-col" style={{ height: '500px' }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">{selected.subject || 'Sem assunto'}</p>
                <p className="text-xs text-muted-foreground">{selected.email || selected.user_id?.slice(0, 8)} · {new Date(selected.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOR[selected.status]}`}>{selected.status}</span>
                {selected.status !== 'resolved' && (
                  <button onClick={resolve} className="flex items-center gap-1.5 text-xs text-green-400 border border-green-500/30 rounded-lg px-3 py-1.5 hover:bg-green-500/10 transition-colors">
                    <CheckCircle className="h-3.5 w-3.5" /> Resolver
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.sender_type === 'support' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.sender_type === 'support' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                    {msg.message}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-0.5 mx-1">
                    {msg.sender_type === 'support' ? 'Suporte' : 'Usuário'} · {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-3 flex gap-2">
              <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()}
                placeholder="Responder..." className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <button onClick={sendReply} disabled={!reply.trim() || sending}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card/50 flex items-center justify-center" style={{ height: '500px' }}>
            <div className="text-center space-y-2">
              <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Selecione um ticket</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TicketCard({ ticket, selected, onClick }: { ticket: Ticket; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
      selected ? 'border-primary/30 bg-primary/5' : 'border-border bg-card hover:border-primary/20'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground line-clamp-1">{ticket.subject || 'Sem assunto'}</p>
        <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_COLOR[ticket.status]}`}>{ticket.status}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{ticket.email || ticket.user_id?.slice(0, 12) || 'Anônimo'}</p>
      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{new Date(ticket.created_at).toLocaleString('pt-BR')}</p>
    </button>
  )
}

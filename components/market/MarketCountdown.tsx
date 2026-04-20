'use client'

import { useEffect, useState } from 'react'
import { Clock, Lock, CheckCircle } from 'lucide-react'

interface Props {
  closesAt: string | null
  resolvesAt: string | null
  status: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calcTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  return {
    total: diff,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

function urgencyClass(t: TimeLeft, status: string) {
  if (status !== 'open') return 'border-border bg-card/50 text-muted-foreground'
  if (t.total <= 0) return 'border-red-500/40 bg-red-500/10 text-red-400'
  if (t.days === 0 && t.hours < 2) return 'border-red-500/40 bg-red-500/10 text-red-400'
  if (t.days === 0 && t.hours < 24) return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
  return 'border-primary/30 bg-primary/5 text-primary'
}

export function MarketCountdown({ closesAt, resolvesAt, status }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [phase, setPhase] = useState<'betting' | 'resolving' | 'resolved'>('betting')

  useEffect(() => {
    function tick() {
      const now = Date.now()
      const closesTime = closesAt ? new Date(closesAt).getTime() : null
      const resolvesTime = resolvesAt ? new Date(resolvesAt).getTime() : null

      if (status === 'resolved') {
        setPhase('resolved')
        setTimeLeft(null)
        return
      }

      if (closesTime && now < closesTime) {
        setPhase('betting')
        setTimeLeft(calcTimeLeft(closesAt!))
      } else if (resolvesTime && now < resolvesTime) {
        setPhase('resolving')
        setTimeLeft(calcTimeLeft(resolvesAt!))
      } else {
        setPhase('resolving')
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [closesAt, resolvesAt, status])

  if (phase === 'resolved') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 w-fit">
        <CheckCircle className="h-4 w-4 text-green-400" />
        <span className="text-sm font-semibold text-green-400">Mercado resolvido</span>
      </div>
    )
  }

  if (!timeLeft) return null

  const uClass = urgencyClass(timeLeft, status)
  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 2 && status === 'open'

  return (
    <div className={`rounded-2xl border px-4 py-3 ${uClass}`}>
      <div className="flex items-center gap-2 mb-2">
        {phase === 'betting' ? (
          <Clock className={`h-4 w-4 ${isUrgent ? 'animate-pulse' : ''}`} />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        <span className="text-xs font-semibold uppercase tracking-wider">
          {phase === 'betting' ? 'Previsões encerram em' : 'Resolução em'}
        </span>
      </div>

      {timeLeft.total > 0 ? (
        <div className="flex items-end gap-3">
          {timeLeft.days > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold font-mono leading-none">{pad(timeLeft.days)}</p>
              <p className="text-[10px] uppercase tracking-wider opacity-70 mt-1">dias</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-2xl font-bold font-mono leading-none">{pad(timeLeft.hours)}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-70 mt-1">horas</p>
          </div>
          <div className="text-xl font-bold opacity-60 mb-0.5">:</div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono leading-none">{pad(timeLeft.minutes)}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-70 mt-1">min</p>
          </div>
          <div className="text-xl font-bold opacity-60 mb-0.5">:</div>
          <div className="text-center">
            <p className={`text-2xl font-bold font-mono leading-none ${isUrgent ? 'animate-pulse' : ''}`}>
              {pad(timeLeft.seconds)}
            </p>
            <p className="text-[10px] uppercase tracking-wider opacity-70 mt-1">seg</p>
          </div>
        </div>
      ) : (
        <p className="text-sm font-semibold">Aguardando resolução</p>
      )}

      {phase === 'betting' && closesAt && (
        <p className="text-[10px] opacity-60 mt-2">
          Fecha: {new Date(closesAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  )
}

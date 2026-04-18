'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/')
    })
  }, [router])

  const submit = async () => {
    setLoading(true)
    setMsg(null)

    try {
      if (!email || !password) throw new Error('Preencha e-mail e senha')

      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }

      router.push('/')
    } catch (e: any) {
      setMsg(e?.message ?? 'Erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">{mode === 'signin' ? 'Entrar' : 'Criar conta'}</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Login simples via Supabase Auth (e-mail/senha).
      </p>

      <div className="mt-6 space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
        <label className="block">
          <div className="text-xs text-neutral-500">E-mail</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-neutral-500"
            placeholder="voce@exemplo.com"
          />
        </label>

        <label className="block">
          <div className="text-xs text-neutral-500">Senha</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-neutral-500"
            placeholder="••••••••"
          />
        </label>

        {msg ? (
          <div className="rounded-xl border border-red-800 bg-red-950/30 px-3 py-2 text-sm text-red-200">
            {msg}
          </div>
        ) : null}

        <button
          disabled={loading}
          onClick={submit}
          className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200 disabled:opacity-60"
        >
          {loading ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
        </button>

        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="w-full rounded-xl border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-900"
        >
          {mode === 'signin' ? 'Quero criar conta' : 'Já tenho conta'}
        </button>
      </div>
    </div>
  )
}

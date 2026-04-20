'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Search, MessageCircle, ChevronDown, ChevronUp,
  HelpCircle, Wallet, Shield, TrendingUp, Users, 
  Settings, BookOpen, AlertTriangle, ExternalLink
} from 'lucide-react'

interface FAQItem {
  q: string
  a: string
}

interface Category {
  id: string
  label: string
  icon: any
  color: string
  items: FAQItem[]
}

const CATEGORIES: Category[] = [
  {
    id: 'inicio',
    label: 'Primeiros Passos',
    icon: BookOpen,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    items: [
      { q: 'O que é o CenárioX?', a: 'O CenárioX é uma plataforma brasileira de mercados preditivos. Você aposta em resultados de eventos reais — política, esportes, economia, entretenimento — e ganha se sua previsão estiver correta.' },
      { q: 'Como funciona um mercado preditivo?', a: 'Cada mercado é uma pergunta com 2 ou mais opções. Você aposta um valor numa opção. Se a opção for resolvida como vencedora, você recebe de volta o valor apostado multiplicado pelas odds. As odds refletem a probabilidade coletiva de cada resultado.' },
      { q: 'Como me cadastro?', a: 'Clique em "Entrar" no menu superior, depois em "Criar conta". Use seu e-mail ou login social (Google). Após o cadastro, complete seu perfil e aceite os Termos de Uso para ativar a conta.' },
      { q: 'É gratuito usar o CenárioX?', a: 'Sim! Criar conta e explorar mercados é gratuito. Para apostar, você precisa depositar saldo. O plano PRO (R$ 29,90/mês) libera análises de IA e outras funcionalidades avançadas.' },
      { q: 'Qual a idade mínima?', a: 'Você precisa ter 18 anos ou mais para usar o CenárioX, conforme exigido na confirmação dos Termos de Uso.' },
    ]
  },
  {
    id: 'deposito',
    label: 'Depósitos e Saques',
    icon: Wallet,
    color: 'text-green-400 bg-green-500/10 border-green-500/20',
    items: [
      { q: 'Como faço um depósito?', a: 'Acesse Carteira → Depositar. Informe o valor (mínimo R$ 10,00), gere o código PIX e pague pelo app do seu banco. O saldo é creditado automaticamente após a confirmação, geralmente em menos de 1 minuto.' },
      { q: 'Quais formas de pagamento são aceitas?', a: 'Atualmente aceitamos apenas PIX. Outras formas de pagamento (cartão, boleto) podem ser adicionadas no futuro.' },
      { q: 'Como solicito um saque?', a: 'Acesse Carteira → Sacar. Informe o valor desejado e sua chave PIX. O saque é processado em até 24 horas em dias úteis. Saques acima de R$ 5.000/mês podem ter taxa de 1%.' },
      { q: 'Por que meu depósito não caiu?', a: 'Verifique se o PIX foi realmente debitado no seu banco. Se sim, aguarde até 5 minutos. Caso persista, verifique o histórico de transações na Carteira. Se não aparecer, entre em contato com o suporte informando o comprovante.' },
      { q: 'O saldo apostado fica bloqueado?', a: 'Sim. Quando você faz uma aposta, o valor fica bloqueado ("em apostas") até a resolução do mercado. Você pode ver seu saldo bloqueado na Carteira.' },
    ]
  },
  {
    id: 'apostas',
    label: 'Como Apostar',
    icon: TrendingUp,
    color: 'text-primary bg-primary/10 border-primary/20',
    items: [
      { q: 'Como faço uma aposta?', a: 'Abra um mercado → Escolha uma opção → Informe o valor → Clique em "Confirmar aposta". O valor é debitado do seu saldo imediatamente e fica bloqueado até a resolução.' },
      { q: 'O que são odds?', a: 'Odds representam quanto você recebe por cada R$ 1 apostado se ganhar. Por exemplo, odds de 2.50 significam que para cada R$ 10 apostados você recebe R$ 25 se ganhar (lucro de R$ 15).' },
      { q: 'Posso vender minha posição?', a: 'Sim! No widget de aposta, clique na aba "Vender". Suas posições abertas aparecem com o valor de venda atual. O valor é calculado com base na probabilidade atual menos um spread de 5%.' },
      { q: 'Como um mercado é resolvido?', a: 'Cada mercado tem uma fonte oficial definida (ex: TSE para eleições, placar oficial para esportes). Quando o evento ocorre, a equipe do CenárioX verifica o resultado na fonte e resolve o mercado. Os ganhos são creditados automaticamente.' },
      { q: 'O que acontece se um mercado for cancelado?', a: 'Se um mercado for cancelado por qualquer motivo (evento não ocorreu, ambiguidade no resultado), todas as apostas são devolvidas integralmente sem desconto.' },
      { q: 'Qual o valor mínimo de aposta?', a: 'O valor mínimo é R$ 1,00 por aposta.' },
    ]
  },
  {
    id: 'conta',
    label: 'Conta e Perfil',
    icon: Users,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    items: [
      { q: 'Como altero minha senha?', a: 'Acesse Conta → "Esqueci minha senha" na tela de login, ou use a opção de redefinição via e-mail. Por segurança, não armazenamos senhas em texto plano.' },
      { q: 'O que é o plano PRO?', a: 'O plano PRO (R$ 29,90/mês) libera: análise de IA em cada mercado, sugestões personalizadas de apostas, proposta de mercados e badge PRO no perfil.' },
      { q: 'Como me torno influencer?', a: 'Acesse a página de Upgrade e clique em "Candidatar-se" no plano Influencer. Nossa equipe analisa em até 48h. Influencers podem criar mercados e recebem comissão em cada aposta.' },
      { q: 'Como excluo minha conta?', a: 'Entre em contato com o suporte via e-mail ou WhatsApp solicitando a exclusão. Processamos em até 15 dias úteis conforme a LGPD. Saldo disponível é devolvido antes da exclusão.' },
    ]
  },
  {
    id: 'seguranca',
    label: 'Segurança e Legal',
    icon: Shield,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    items: [
      { q: 'O CenárioX é legal no Brasil?', a: 'Mercados preditivos operam numa área regulatória em evolução no Brasil. O CenárioX opera como plataforma de entretenimento e previsões. Recomendamos verificar a legalidade na sua jurisdição específica em caso de dúvida.' },
      { q: 'Meus dados estão protegidos?', a: 'Sim. Seguimos a LGPD (Lei Geral de Proteção de Dados). Seus dados são criptografados e nunca vendidos a terceiros. Consulte nossa Política de Privacidade para detalhes.' },
      { q: 'Como reportar comportamento suspeito?', a: 'Se suspeitar de manipulação de mercados, fraude ou comportamento inapropriado no chat, entre em contato com o suporte descrevendo a situação. Investigamos todos os casos reportados.' },
      { q: 'O que é jogo responsável?', a: 'Aposte apenas valores que pode se dar ao luxo de perder. Estabeleça limites. Se sentir que perdeu o controle, procure ajuda especializada. O CenárioX não é recomendado para pessoas com problemas de jogo compulsivo.' },
    ]
  },
  {
    id: 'tecnico',
    label: 'Problemas Técnicos',
    icon: Settings,
    color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    items: [
      { q: 'O site está lento ou com erro. O que faço?', a: 'Tente limpar o cache do navegador (Ctrl+Shift+Del), desativar extensões, ou usar outro navegador. Se o problema persistir, verifique nossa página de status ou entre em contato.' },
      { q: 'Não consigo fazer login. O que fazer?', a: 'Verifique se o e-mail está correto. Use "Esqueci a senha" para redefinir. Se o problema persistir, entre em contato informando seu e-mail cadastrado.' },
      { q: 'Minha aposta não aparece no histórico.', a: 'Aguarde alguns instantes e recarregue a página. Se não aparecer em 5 minutos, verifique o histórico na Carteira. Caso o valor tenha sido debitado mas a aposta não registrada, entre em contato com o suporte.' },
    ]
  },
]

export default function AjudaPage() {
  const [search, setSearch] = useState('')
  const [openCat, setOpenCat] = useState<string>('inicio')
  const [openItem, setOpenItem] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return CATEGORIES
    const q = search.toLowerCase()
    return CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(item =>
        item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      )
    })).filter(cat => cat.items.length > 0)
  }, [search])

  const totalArticles = CATEGORIES.reduce((s, c) => s + c.items.length, 0)

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-10">

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/15 border border-primary/20">
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Central de Ajuda</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Encontre respostas para as perguntas mais comuns sobre depósitos, apostas, conta e como funcionam os mercados preditivos.
        </p>
        <p className="text-xs text-muted-foreground/60">
          {totalArticles} artigos em {CATEGORIES.length} categorias
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por perguntas ou palavras-chave..."
          className="w-full rounded-2xl border border-border bg-card pl-12 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
            Limpar
          </button>
        )}
      </div>

      {/* Falar com suporte */}
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl border border-border bg-card/60 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Falar com suporte</p>
            <p className="text-xs text-muted-foreground mt-0.5">Não encontrou o que procura? Nossa equipe responde em até 24h.</p>
          </div>
          <a
            href="mailto:suporte@cenariox.com.br"
            className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Contato <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Categorias — busca ativa */}
      {search ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {filtered.reduce((s, c) => s + c.items.length, 0)} resultado(s) para "{search}"
          </p>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card/50 p-10 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
              <button onClick={() => setSearch('')} className="mt-2 text-xs text-primary hover:underline">Limpar busca</button>
            </div>
          ) : (
            filtered.map(cat => (
              <div key={cat.id} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat.label}</p>
                {cat.items.map((item, i) => (
                  <FAQCard key={i} item={item} isOpen={openItem === `${cat.id}-${i}`}
                    onToggle={() => setOpenItem(openItem === `${cat.id}-${i}` ? null : `${cat.id}-${i}`)} />
                ))}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Grade de categorias */
        <div className="space-y-6">
          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setOpenCat(cat.id)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    openCat === cat.id
                      ? `${cat.color} shadow-sm`
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    openCat === cat.id ? 'bg-white/20' : 'bg-muted'
                  }`}>
                    {cat.items.length}
                  </span>
                </button>
              )
            })}
          </div>

          {/* FAQs da categoria selecionada */}
          {CATEGORIES.filter(c => c.id === openCat).map(cat => (
            <div key={cat.id} className="space-y-2">
              {cat.items.map((item, i) => (
                <FAQCard
                  key={i}
                  item={item}
                  isOpen={openItem === `${cat.id}-${i}`}
                  onToggle={() => setOpenItem(openItem === `${cat.id}-${i}` ? null : `${cat.id}-${i}`)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Links úteis */}
      <div className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
        <p className="text-sm font-semibold text-foreground">Links úteis</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Termos de Uso', href: '/p/termos' },
            { label: 'Política de Privacidade', href: '/p/privacidade' },
            { label: 'Como Funciona', href: '/p/como-funciona' },
            { label: 'Explorar Mercados', href: '/mercados' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

function FAQCard({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-xl border transition-all ${isOpen ? 'border-primary/20 bg-primary/5' : 'border-border bg-card hover:border-primary/20'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
      >
        <span className={`text-sm font-medium leading-snug ${isOpen ? 'text-primary' : 'text-foreground'}`}>
          {item.q}
        </span>
        {isOpen
          ? <ChevronUp className="h-4 w-4 text-primary flex-shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  )
}

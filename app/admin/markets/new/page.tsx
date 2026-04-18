'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createMarket, Market } from '@/lib/api/admin'

interface MarketOption {
  id: string
  label: string
  key: string
}

export default function NewMarketPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category: '',
    opens_at: new Date().toISOString().slice(0, 16),
    closes_at: '',
    resolves_at: '',
    resolution_source: '',
    featured: false,
  })

  const [options, setOptions] = useState<MarketOption[]>([
    { id: '1', label: 'Sim', key: 'yes' },
    { id: '2', label: 'Não', key: 'no' },
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validar campos obrigatorios
      if (!formData.title || !formData.category || !formData.closes_at) {
        throw new Error('Preencha todos os campos obrigatórios')
      }

      if (options.some((o) => !o.label)) {
        throw new Error('Todas as opções devem ter um nome')
      }

      // Gerar slug a partir do titulo
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50)

      // Preparar dados do mercado
      const marketData: Partial<Market> = {
        title: formData.title,
        slug,
        description: formData.description,
        category: formData.category,
        opens_at: formData.opens_at,
        closes_at: formData.closes_at,
        resolves_at: formData.resolves_at || null,
        resolution_source: formData.resolution_source || null,
        featured: formData.featured,
        status: 'draft',
      }

      const { data, error: createError } = await createMarket(marketData)

      if (createError) {
        throw new Error(createError)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/markets')
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Erro ao criar mercado')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addOption = () => {
    const newId = (options.length + 1).toString()
    setOptions([...options, { id: newId, label: '', key: `option_${newId}` }])
  }

  const removeOption = (id: string) => {
    if (options.length <= 2) return
    setOptions(options.filter((o) => o.id !== id))
  }

  const updateOption = (id: string, label: string) => {
    setOptions(
      options.map((o) => (o.id === id ? { ...o, label } : o))
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/markets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Novo Mercado</h1>
          <p className="text-muted-foreground">
            Crie um novo mercado preditivo
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-success bg-success/10 p-4 text-success">
          Mercado criado com sucesso! Redirecionando...
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Título do Mercado *
                </label>
                <Input
                  placeholder="Ex: Bitcoin acima de $100k até dezembro 2024"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value })
                    setError(null)
                  }}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Descrição
                </label>
                <textarea
                  className="flex min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Descreva os critérios de resolução do mercado..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Categoria *
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="politica">Política</option>
                  <option value="economia">Economia</option>
                  <option value="esportes">Esportes</option>
                  <option value="tecnologia">Tecnologia</option>
                  <option value="cripto">Cripto</option>
                  <option value="entretenimento">Entretenimento</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="featured" className="text-sm font-medium cursor-pointer">
                  Destacar mercado (mostra na primeira página)
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Opções de Resposta</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <span className="w-6 text-sm text-muted-foreground">
                    {index + 1}.
                  </span>
                  <Input
                    placeholder="Nome da opção"
                    value={option.label}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(option.id)}
                    disabled={options.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Abertura de Apostas
                </label>
                <Input
                  type="datetime-local"
                  value={formData.opens_at}
                  onChange={(e) =>
                    setFormData({ ...formData, opens_at: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Encerramento de Apostas *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.closes_at}
                  onChange={(e) =>
                    setFormData({ ...formData, closes_at: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Data de Resolução
                </label>
                <Input
                  type="datetime-local"
                  value={formData.resolves_at}
                  onChange={(e) =>
                    setFormData({ ...formData, resolves_at: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fonte de Resolução</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Ex: Resultado oficial do TSE"
                value={formData.resolution_source}
                onChange={(e) =>
                  setFormData({ ...formData, resolution_source: e.target.value })
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Rascunho</Badge>
              <p className="mt-2 text-xs text-muted-foreground">
                O mercado será criado como rascunho e poderá ser editado ou publicado depois.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/admin/markets')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Criar Mercado'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

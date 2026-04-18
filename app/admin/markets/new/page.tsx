'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface MarketOption {
  id: string
  label: string
  key: string
}

export default function NewMarketPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    closesAt: '',
    resolvesAt: '',
    resolutionSource: '',
  })

  const [options, setOptions] = useState<MarketOption[]>([
    { id: '1', label: 'Sim', key: 'yes' },
    { id: '2', label: 'Nao', key: 'no' },
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // TODO: Implementar chamada API real
    console.log('Criando mercado:', { ...formData, options })
    
    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    router.push('/admin/markets')
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

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes Basicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Titulo do Mercado
                </label>
                <Input
                  placeholder="Ex: Bitcoin acima de $100k ate dezembro 2024"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Descricao
                </label>
                <textarea
                  className="flex min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Descreva os criterios de resolucao do mercado..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Categoria
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
                  <option value="politica">Politica</option>
                  <option value="economia">Economia</option>
                  <option value="esportes">Esportes</option>
                  <option value="tecnologia">Tecnologia</option>
                  <option value="cripto">Cripto</option>
                  <option value="entretenimento">Entretenimento</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Opcoes de Resposta</CardTitle>
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
                    placeholder="Nome da opcao"
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
                  Encerramento de Apostas
                </label>
                <Input
                  type="datetime-local"
                  value={formData.closesAt}
                  onChange={(e) =>
                    setFormData({ ...formData, closesAt: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Data de Resolucao
                </label>
                <Input
                  type="datetime-local"
                  value={formData.resolvesAt}
                  onChange={(e) =>
                    setFormData({ ...formData, resolvesAt: e.target.value })
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fonte de Resolucao</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Ex: Resultado oficial do TSE"
                value={formData.resolutionSource}
                onChange={(e) =>
                  setFormData({ ...formData, resolutionSource: e.target.value })
                }
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/admin/markets')}
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

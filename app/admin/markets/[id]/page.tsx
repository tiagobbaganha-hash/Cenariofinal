'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Save, Trash2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { fetchMarketById, updateMarket, archiveMarket, Market } from '@/lib/api/admin'

export default function EditMarketPage() {
  const router = useRouter()
  const params = useParams()
  const marketId = params.id as string

  const [market, setMarket] = useState<Market | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const loadMarket = async () => {
      try {
        const data = await fetchMarketById(marketId)
        if (!data) {
          setError('Mercado não encontrado')
          return
        }
        setMarket(data)
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar mercado')
      } finally {
        setLoading(false)
      }
    }

    loadMarket()
  }, [marketId])

  const handleSave = async () => {
    if (!market) return
    setIsSaving(true)
    setError(null)

    try {
      const { error: updateError } = await updateMarket(marketId, {
        title: market.title,
        description: market.description,
        category: market.category,
        featured: market.featured,
        status: market.status,
        closes_at: market.closes_at,
        resolves_at: market.resolves_at,
        resolution_source: market.resolution_source,
      })

      if (updateError) {
        throw new Error(updateError)
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!market) return
    setIsDeleting(true)
    setError(null)

    try {
      const { error: archiveError } = await archiveMarket(marketId)

      if (archiveError) {
        throw new Error(archiveError)
      }

      router.push('/admin/markets')
    } catch (err: any) {
      setError(err.message || 'Erro ao arquivar')
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/markets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  if (!market || error === 'Mercado não encontrado') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/markets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Mercado não encontrado</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            O mercado que você está procurando não existe ou foi removido.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/markets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Editar Mercado</h1>
            <p className="text-sm text-muted-foreground">
              ID: {marketId}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>Mercado atualizado com sucesso!</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Título
                </label>
                <Input
                  value={market.title}
                  onChange={(e) =>
                    setMarket({ ...market, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Descrição
                </label>
                <textarea
                  className="flex min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={market.description}
                  onChange={(e) =>
                    setMarket({ ...market, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Categoria
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={market.category}
                  onChange={(e) =>
                    setMarket({ ...market, category: e.target.value })
                  }
                >
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
                  checked={market.featured}
                  onChange={(e) =>
                    setMarket({ ...market, featured: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="featured" className="text-sm font-medium cursor-pointer">
                  Destacar na primeira página
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datas e Resolução</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Encerramento de Apostas
                </label>
                <Input
                  type="datetime-local"
                  value={market.closes_at?.slice(0, 16) || ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value).toISOString() : null
                    setMarket({ ...market, closes_at: date })
                  }}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Data de Resolução
                </label>
                <Input
                  type="datetime-local"
                  value={market.resolves_at?.slice(0, 16) || ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value).toISOString() : null
                    setMarket({ ...market, resolves_at: date })
                  }}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Fonte de Resolução
                </label>
                <textarea
                  className="flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={market.resolution_source || ''}
                  onChange={(e) =>
                    setMarket({ ...market, resolution_source: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Alterar Status
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={market.status}
                  onChange={(e) =>
                    setMarket({
                      ...market,
                      status: e.target.value as Market['status'],
                    })
                  }
                >
                  <option value="draft">Rascunho</option>
                  <option value="open">Aberto</option>
                  <option value="suspended">Suspenso</option>
                  <option value="closed">Fechado</option>
                  <option value="resolved">Resolvido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Criado em {new Date(market.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>

              {!showDeleteConfirm ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Arquivar Mercado
                </Button>
              ) : (
                <div className="space-y-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                  <p className="text-sm font-medium">Confirmar arquivamento?</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={handleArchive}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Arquivando...' : 'Confirmar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

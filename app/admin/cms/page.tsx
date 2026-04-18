'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

interface CmsPage {
  id: string
  slug: string
  title: string
  status: 'published' | 'draft' | 'archived'
  updated_at: string
}

// Mock data - será conectado ao Supabase
const mockPages: CmsPage[] = [
  {
    id: '1',
    slug: 'terms',
    title: 'Termos de Serviço',
    status: 'published',
    updated_at: '2024-03-20',
  },
  {
    id: '2',
    slug: 'privacy',
    title: 'Política de Privacidade',
    status: 'published',
    updated_at: '2024-03-15',
  },
  {
    id: '3',
    slug: 'faq',
    title: 'Perguntas Frequentes',
    status: 'draft',
    updated_at: '2024-03-10',
  },
  {
    id: '4',
    slug: 'about',
    title: 'Sobre CenarioX',
    status: 'published',
    updated_at: '2024-03-05',
  },
]

const statusConfig: Record<'published' | 'draft' | 'archived', { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  published: { label: 'Publicado', variant: 'success' },
  draft: { label: 'Rascunho', variant: 'warning' },
  archived: { label: 'Arquivado', variant: 'secondary' },
}

export default function CmsPage() {
  const [pages, setPages] = useState<CmsPage[]>(mockPages)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  const filteredPages = pages.filter((page) => {
    if (filter === 'all') return true
    return page.status === filter
  })

  const deletePage = (id: string) => {
    if (confirm('Tem certeza que deseja arquivar esta página?')) {
      setPages(pages.map((p) => (p.id === id ? { ...p, status: 'archived' as const } : p)))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciador de Conteúdo"
        description="Crie e edite páginas estáticas do site"
        action={{
          label: 'Nova Página',
          href: '/admin/cms/new',
        }}
      />

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todas ({pages.length})
        </Button>
        <Button
          variant={filter === 'published' ? 'default' : 'outline'}
          onClick={() => setFilter('published')}
        >
          Publicadas ({pages.filter((p) => p.status === 'published').length})
        </Button>
        <Button
          variant={filter === 'draft' ? 'default' : 'outline'}
          onClick={() => setFilter('draft')}
        >
          Rascunhos ({pages.filter((p) => p.status === 'draft').length})
        </Button>
      </div>

      {/* Pages Grid */}
      <div className="grid gap-4">
        {filteredPages.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Nenhuma página encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredPages.map((page) => (
            <Card key={page.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{page.title}</h3>
                      <Badge variant={statusConfig[page.status].variant}>
                        {statusConfig[page.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      /{page.slug}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Atualizado em {new Date(page.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/${page.slug}`} target="_blank">
                      <Button variant="ghost" size="sm" title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/cms/${page.id}`}>
                      <Button variant="ghost" size="sm" title="Editar">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePage(page.id)}
                      title="Arquivar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

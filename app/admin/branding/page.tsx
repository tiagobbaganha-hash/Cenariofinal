'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { Save, Loader2, Palette } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'

export default function AdminBranding() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    brand_name: '', app_title: '', app_tagline: '',
    logo_url: '', logo_dark_url: '', logo_light_url: '', favicon_url: '', login_background_url: '', hero_banner_url: '',
    color_primary: '#F59E0B', color_secondary: '#FB923C', color_accent: '#22C55E',
    color_bg: '#0B0F14', color_surface: '#111827', color_text: '#E5E7EB',
    font_family: 'Inter',
    support_email: '', support_whatsapp: '',
    instagram_url: '', youtube_url: '', telegram_url: '', x_url: '',
    maintenance_mode: false, maintenance_message: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('branding_settings').select('*').eq('id', 1).single()
      if (data) {
        setForm({
          brand_name: data.brand_name || data.app_name || data.site_name || '',
          app_title: data.app_title || '', app_tagline: data.app_tagline || '',
          logo_url: data.logo_url || '', logo_dark_url: data.logo_dark_url || '', logo_light_url: data.logo_light_url || '', favicon_url: data.favicon_url || '',
          login_background_url: data.login_background_url || '',
          hero_banner_url: data.custom_css || '', // reusing custom_css field for hero banner URL
          color_primary: data.color_primary || '#F59E0B',
          color_secondary: data.color_secondary || '#FB923C',
          color_accent: data.color_accent || '#22C55E',
          color_bg: data.color_bg || '#0B0F14',
          color_surface: data.color_surface || '#111827',
          color_text: data.color_text || '#E5E7EB',
          font_family: data.font_family || 'Inter',
          support_email: data.support_email || '', support_whatsapp: data.support_whatsapp || '',
          instagram_url: data.instagram_url || '', youtube_url: data.youtube_url || '',
          telegram_url: data.telegram_url || '', x_url: data.x_url || '',
          maintenance_mode: data.maintenance_mode || false,
          maintenance_message: data.maintenance_message || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('branding_settings').update({
        brand_name: form.brand_name, app_name: form.brand_name, site_name: form.brand_name,
        app_title: form.app_title, app_tagline: form.app_tagline,
        logo_url: form.logo_url, logo_dark_url: form.logo_dark_url, logo_light_url: form.logo_light_url, favicon_url: form.favicon_url,
        login_background_url: form.login_background_url,
        custom_css: form.hero_banner_url, // reusing for hero banner URL
        color_primary: form.color_primary, color_secondary: form.color_secondary,
        color_accent: form.color_accent, color_bg: form.color_bg,
        color_surface: form.color_surface, color_text: form.color_text,
        font_family: form.font_family,
        support_email: form.support_email, support_whatsapp: form.support_whatsapp,
        instagram_url: form.instagram_url, youtube_url: form.youtube_url,
        telegram_url: form.telegram_url, x_url: form.x_url,
        maintenance_mode: form.maintenance_mode, maintenance_message: form.maintenance_message,
      }).eq('id', 1)
      if (error) throw error
      toast({ type: 'success', title: 'Branding salvo!' })
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro', description: err?.message })
    } finally { setSaving(false) }
  }

  function Field({ label, field, type = 'text' }: { label: string; field: keyof typeof form; type?: string }) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <div className="flex gap-2">
          {type === 'color' && (
            <input type="color" value={form[field] as string}
              onChange={e => setForm({ ...form, [field]: e.target.value })}
              className="h-10 w-10 rounded-lg border border-border cursor-pointer" />
          )}
          <input type="text" value={form[field] as string}
            onChange={e => setForm({ ...form, [field]: e.target.value })}
            className="flex-1 h-10 px-4 rounded-lg bg-background border border-border outline-none text-sm" />
        </div>
      </div>
    )
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branding</h1>
          <p className="text-muted-foreground">Identidade visual e configurações do site</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
      </div>

      {/* Identity */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Palette className="h-5 w-5" /> Identidade</h2>
        <Field label="Nome da marca" field="brand_name" />
        <Field label="Título do app" field="app_title" />
        <Field label="Tagline" field="app_tagline" />
        
        <div>
          <label className="block text-sm font-medium mb-2">Logo</label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Logo Principal (padrão)</label>
              <ImageUpload value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })} bucket="market-images" folder="branding" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Logo Tema Escuro</label>
                <ImageUpload value={form.logo_dark_url} onChange={(url) => setForm({ ...form, logo_dark_url: url })} bucket="market-images" folder="branding" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Logo Tema Claro</label>
                <ImageUpload value={form.logo_light_url} onChange={(url) => setForm({ ...form, logo_light_url: url })} bucket="market-images" folder="branding" />
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Favicon</label>
          <ImageUpload value={form.favicon_url} onChange={(url) => setForm({ ...form, favicon_url: url })} bucket="market-images" folder="branding" />
        </div>

        <div>
          {/* Banner da Home removido - não utilizado na versão atual */}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Background da página de login</label>
          <ImageUpload value={form.login_background_url} onChange={(url) => setForm({ ...form, login_background_url: url })} bucket="market-images" folder="branding" />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Fonte principal</label>
          <select value={form.font_family} onChange={e => setForm({...form, font_family: e.target.value})}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="Inter">Inter (padrão — recomendado)</option>
            <option value="Poppins">Poppins (moderna, geométrica)</option>
            <option value="Nunito">Nunito (amigável, arredondada)</option>
            <option value="Roboto">Roboto (Google, familiar)</option>
            <option value="Sora">Sora (futurista)</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">Aplicada em todo o site após salvar</p>
        </div>
      </div>

      {/* Colors */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <h2 className="font-semibold">Cores</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Primária" field="color_primary" type="color" />
          <Field label="Secundária" field="color_secondary" type="color" />
          <Field label="Accent" field="color_accent" type="color" />
          <Field label="Background" field="color_bg" type="color" />
          <Field label="Surface" field="color_surface" type="color" />
          <Field label="Texto" field="color_text" type="color" />
        </div>
      </div>

      {/* Social */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <h2 className="font-semibold">Contato & Redes</h2>
        <Field label="Email de suporte" field="support_email" />
        <Field label="WhatsApp" field="support_whatsapp" />
        <Field label="Instagram" field="instagram_url" />
        <Field label="YouTube" field="youtube_url" />
        <Field label="Telegram" field="telegram_url" />
        <Field label="Twitter/X" field="x_url" />
      </div>

      {/* Maintenance */}
      <div className="rounded-xl bg-card border border-border p-6 space-y-4">
        <h2 className="font-semibold">Manutenção</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.maintenance_mode}
            onChange={e => setForm({ ...form, maintenance_mode: e.target.checked })}
            className="h-4 w-4 rounded accent-primary" />
          <span className="text-sm">Modo manutenção ativo</span>
        </label>
        <Field label="Mensagem de manutenção" field="maintenance_message" />
      </div>
    </div>
  )
}

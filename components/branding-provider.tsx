'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Converte hex (#F59E0B) para HSL string "45 96% 53%"
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1,3),16)/255
  const g = parseInt(hex.slice(3,5),16)/255
  const b = parseInt(hex.slice(5,7),16)/255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  let h=0, s=0, l=(max+min)/2
  if (max !== min) {
    const d = max-min
    s = l>0.5 ? d/(2-max-min) : d/(max+min)
    h = max===r ? ((g-b)/d+(g<b?6:0))/6
      : max===g ? ((b-r)/d+2)/6
      : ((r-g)/d+4)/6
  }
  return `${Math.round(h*360)} ${Math.round(s*100)}% ${Math.round(l*100)}%`
}

export function BrandingProvider() {
  useEffect(() => {
    async function applyBranding() {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('branding_settings').select('*').eq('id', 1).single()
        if (!data) return

        const root = document.documentElement

        // Aplicar cores como CSS variables HSL (formato que o Tailwind usa)
        if (data.color_primary && data.color_primary.startsWith('#')) {
          root.style.setProperty('--primary', hexToHsl(data.color_primary))
        }
        if (data.color_secondary && data.color_secondary.startsWith('#')) {
          root.style.setProperty('--secondary', hexToHsl(data.color_secondary))
        }
        if (data.color_accent && data.color_accent.startsWith('#')) {
          root.style.setProperty('--accent', hexToHsl(data.color_accent))
        }
        // Background/surface não são alterados via branding para preservar o layout
        // Apenas primary, secondary e accent são seguros para sobrescrever

        // Fonte
        if (data.font_family) {
          root.style.setProperty('--font-sans', `'${data.font_family}', Inter, sans-serif`)
          document.body.style.fontFamily = `'${data.font_family}', Inter, sans-serif`
        }

        // Título da aba
        if (data.app_title || data.brand_name) {
          document.title = data.app_title || data.brand_name
        }

        // Favicon dinâmico
        if (data.favicon_url) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
          if (!link) {
            link = document.createElement('link')
            link.rel = 'icon'
            document.head.appendChild(link)
          }
          link.href = data.favicon_url
        }

        // Modo de manutenção
        if (data.maintenance_mode) {
          const path = window.location.pathname
          const isAdmin = path.startsWith('/admin')
          const isLogin = path.startsWith('/login')
          if (!isAdmin && !isLogin) {
            const msg = data.maintenance_message || 'Plataforma em manutenção. Volte em breve.'
            document.body.innerHTML = `
              <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0f14;color:#e5e7eb;font-family:Inter,sans-serif;text-align:center;padding:2rem">
                <div>
                  <div style="font-size:3rem;margin-bottom:1rem">🔧</div>
                  <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:0.5rem">Em Manutenção</h1>
                  <p style="color:#9ca3af">${msg}</p>
                </div>
              </div>`
          }
        }
      } catch (_) {}
    }
    applyBranding()
  }, [])

  return null
}

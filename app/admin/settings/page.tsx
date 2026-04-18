'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Settings, Bell, Lock, Users, AlertCircle } from 'lucide-react'

type SettingsTab = 'general' | 'notifications' | 'security' | 'team'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações da plataforma CenarioX"
      />

      {saved && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>Configurações salvas com sucesso!</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        <TabButton
          icon={Settings}
          label="Geral"
          active={activeTab === 'general'}
          onClick={() => setActiveTab('general')}
        />
        <TabButton
          icon={Bell}
          label="Notificações"
          active={activeTab === 'notifications'}
          onClick={() => setActiveTab('notifications')}
        />
        <TabButton
          icon={Lock}
          label="Segurança"
          active={activeTab === 'security'}
          onClick={() => setActiveTab('security')}
        />
        <TabButton
          icon={Users}
          label="Equipe"
          active={activeTab === 'team'}
          onClick={() => setActiveTab('team')}
        />
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'general' && <GeneralSettings onSave={handleSave} />}
        {activeTab === 'notifications' && <NotificationSettings onSave={handleSave} />}
        {activeTab === 'security' && <SecuritySettings onSave={handleSave} />}
        {activeTab === 'team' && <TeamSettings onSave={handleSave} />}
      </div>
    </div>
  )
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function GeneralSettings({ onSave }: { onSave: () => void }) {
  const [formData, setFormData] = useState({
    platformName: 'CenarioX',
    description: 'Plataforma de mercados preditivos',
    contactEmail: 'suporte@cenariox.com',
    supportUrl: 'https://support.cenariox.com',
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Gerais da Plataforma</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Nome da Plataforma
          </label>
          <Input
            value={formData.platformName}
            onChange={(e) =>
              setFormData({ ...formData, platformName: e.target.value })
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Descrição
          </label>
          <textarea
            className="flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Email de Contato
          </label>
          <Input
            type="email"
            value={formData.contactEmail}
            onChange={(e) =>
              setFormData({ ...formData, contactEmail: e.target.value })
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            URL de Suporte
          </label>
          <Input
            type="url"
            value={formData.supportUrl}
            onChange={(e) =>
              setFormData({ ...formData, supportUrl: e.target.value })
            }
          />
        </div>

        <Button onClick={onSave}>Salvar Alterações</Button>
      </CardContent>
    </Card>
  )
}

function NotificationSettings({ onSave }: { onSave: () => void }) {
  const [settings, setSettings] = useState({
    emailOnMarketCreated: true,
    emailOnMarketClosed: false,
    emailOnNewUser: true,
    smsAlerts: false,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SettingItem
          label="Notificar quando novo mercado é criado"
          checked={settings.emailOnMarketCreated}
          onChange={(value) =>
            setSettings({ ...settings, emailOnMarketCreated: value })
          }
        />

        <SettingItem
          label="Notificar quando mercado é fechado"
          checked={settings.emailOnMarketClosed}
          onChange={(value) =>
            setSettings({ ...settings, emailOnMarketClosed: value })
          }
        />

        <SettingItem
          label="Notificar quando novo usuário se registra"
          checked={settings.emailOnNewUser}
          onChange={(value) =>
            setSettings({ ...settings, emailOnNewUser: value })
          }
        />

        <SettingItem
          label="Alertas por SMS"
          checked={settings.smsAlerts}
          onChange={(value) => setSettings({ ...settings, smsAlerts: value })}
          disabled
        />

        <Button onClick={onSave}>Salvar Notificações</Button>
      </CardContent>
    </Card>
  )
}

function SecuritySettings({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  2FA não está habilitado para sua conta admin
                </p>
              </div>
              <Badge variant="secondary">Desativado</Badge>
            </div>
          </div>
          <Button variant="outline" disabled>
            Configurar 2FA (Em breve)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessões Ativas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">Seu navegador</p>
                <p className="text-xs text-muted-foreground">
                  São Paulo, Brasil • Agora
                </p>
              </div>
              <Badge variant="success">Atual</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Senha Atual
            </label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              Nova Senha
            </label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              Confirmar Senha
            </label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <Button onClick={onSave}>Alterar Senha</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function TeamSettings({ onSave }: { onSave: () => void }) {
  const [admins, setAdmins] = useState([
    {
      id: '1',
      email: 'admin@cenariox.com',
      role: 'super_admin',
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      email: 'moderador@cenariox.com',
      role: 'admin',
      createdAt: '2024-02-15',
    },
  ])

  const [newAdminEmail, setNewAdminEmail] = useState('')

  const handleAddAdmin = () => {
    if (!newAdminEmail) return
    setAdmins([
      ...admins,
      {
        id: `${admins.length + 1}`,
        email: newAdminEmail,
        role: 'admin',
        createdAt: new Date().toISOString().split('T')[0],
      },
    ])
    setNewAdminEmail('')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="admin@exemplo.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
            />
            <Button onClick={handleAddAdmin}>Adicionar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admins da Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-medium">{admin.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Desde {new Date(admin.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge variant={admin.role === 'super_admin' ? 'destructive' : 'secondary'}>
                  {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingItem({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium cursor-pointer">{label}</label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-input cursor-pointer"
      />
    </div>
  )
}

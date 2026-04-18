'use client'

import { useContext } from 'react'
import { ToastContext } from '@/lib/context/ToastContext'
import { Toast } from '@/components/ui/toast'

export function Toaster() {
  const context = useContext(ToastContext)
  if (!context) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {context.toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => context.removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

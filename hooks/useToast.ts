'use client'

import { useContext } from 'react'
import { ToastContext } from '@/lib/context/ToastContext'

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }

  return {
    success: (title: string, description?: string) =>
      context.addToast({ title, description, type: 'success' }),
    error: (title: string, description?: string) =>
      context.addToast({ title, description, type: 'error' }),
    info: (title: string, description?: string) =>
      context.addToast({ title, description, type: 'info' }),
    warning: (title: string, description?: string) =>
      context.addToast({ title, description, type: 'warning' }),
  }
}

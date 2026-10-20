// ======================================================
// src/components/ui/Toast.tsx
// Notificación flotante accesible — WCAG 2.2 AA:
//   - role="status" / aria-live="polite"
//   - Desaparición automática tras timeout configurable
//   - Soporte para variantes success, info, warning, error
// ======================================================

import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export interface ToastMessage {
  id: string
  title: string
  message?: string
  type?: 'success' | 'info' | 'warning' | 'error'
  durationMs?: number
}

interface ToastProps {
  toast: ToastMessage | null
  onClose: () => void
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      onClose()
    }, toast.durationMs ?? 3500)

    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  const type = toast.type ?? 'success'

  const borderBg = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    info: 'bg-blue-50 border-blue-300 text-blue-900',
    warning: 'bg-amber-50 border-amber-300 text-amber-900',
    error: 'bg-rose-50 border-rose-300 text-rose-900',
  }[type]

  const icon = {
    success: <CheckCircle2 className="text-emerald-600 shrink-0" size={18} aria-hidden="true" />,
    info: <Info className="text-blue-600 shrink-0" size={18} aria-hidden="true" />,
    warning: <AlertCircle className="text-amber-600 shrink-0" size={18} aria-hidden="true" />,
    error: <AlertCircle className="text-rose-600 shrink-0" size={18} aria-hidden="true" />,
  }[type]

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${borderBg}`}
      >
        {icon}
        <div className="flex-1 text-sm">
          <p className="font-semibold">{toast.title}</p>
          {toast.message && <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 rounded-lg p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          aria-label="Cerrar notificación"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

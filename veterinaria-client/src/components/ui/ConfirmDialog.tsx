// ======================================================
// src/components/ui/ConfirmDialog.tsx
// Modal de confirmación accesible — WCAG 2.2 AA:
//   - role="dialog" + aria-modal="true"
//   - aria-labelledby + aria-describedby
//   - Trampa de foco (focus trap): Tab y Shift+Tab
//     no salen del diálogo mientras está abierto
//   - Escape cierra el diálogo
//   - Foco devuelto al elemento disparador al cerrar
//   - Overlay oscuro bloquea interacción con el fondo
// ======================================================

import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
  /** Referencia al elemento que disparó el diálogo para restaurar el foco */
  triggerRef?: React.RefObject<HTMLElement | null>
}

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  onConfirm,
  onCancel,
  triggerRef,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = 'confirm-dialog-title'
  const descId = 'confirm-dialog-desc'

  // ── Trampa de foco ─────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onCancel()
        return
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
    },
    [isOpen, onCancel],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ── Foco inicial al abrir / restaurar al cerrar ─────────────
  useEffect(() => {
    if (isOpen) {
      // Aplaza para que el DOM ya esté renderizado
      setTimeout(() => {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
        focusable?.[0]?.focus()
      }, 50)
    } else {
      // Devuelve el foco al elemento disparador
      triggerRef?.current?.focus()
    }
  }, [isOpen, triggerRef])

  // ── Bloquear scroll del body ────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      aria-hidden="false"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      {/* Diálogo */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6 focus:outline-none"
        tabIndex={-1}
      >
        {/* Icono + Título */}
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle
            size={24}
            className="text-red-500 mt-0.5 flex-shrink-0"
            aria-hidden="true"
          />
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
        </div>

        {/* Descripción */}
        <p id={descId} className="text-sm text-gray-600 mb-6 ml-9">
          {description}
        </p>

        {/* Botones — orden: Cancelar primero para evitar acción accidental */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
            className="min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:outline-none disabled:opacity-50"
          >
            {isLoading ? 'Eliminando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

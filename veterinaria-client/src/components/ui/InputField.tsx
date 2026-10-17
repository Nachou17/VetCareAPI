// ======================================================
// src/components/ui/InputField.tsx
// Campo de formulario reutilizable — WCAG 2.2 AA:
//   - <label> siempre asociado por id/htmlFor
//   - aria-describedby vincula el mensaje de error
//   - aria-invalid refleja el estado de validación
//   - aria-required para campos obligatorios
//   - Tamaño mínimo táctil 44 px (py-2.5 + text-base)
//   - focus-visible:ring-2 para indicador de foco claro
// ======================================================

import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  required?: boolean
  hint?: string
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ id, label, error, required, hint, className = '', ...rest }, ref) => {
    const errorId = `${id}-error`
    const hintId = `${id}-hint`
    const describedBy = [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined

    return (
      <div className="flex flex-col gap-1">
        {/* Label */}
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-red-500">
              {' '}*
            </span>
          )}
        </label>

        {/* Hint opcional */}
        {hint && (
          <p id={hintId} className="text-xs text-gray-500">
            {hint}
          </p>
        )}

        {/* Input */}
        <input
          id={id}
          ref={ref}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={[
            'w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900',
            'transition-colors placeholder:text-gray-400',
            'focus:outline-none focus-visible:ring-2',
            error
              ? 'border-red-400 bg-red-50 focus-visible:ring-red-400'
              : 'border-gray-300 bg-white focus-visible:ring-blue-500',
            'min-h-[44px]', // WCAG 2.2 — tamaño mínimo táctil
            className,
          ].join(' ')}
          {...rest}
        />

        {/* Mensaje de error */}
        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-xs text-red-600 flex items-start gap-1"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
      </div>
    )
  },
)

InputField.displayName = 'InputField'

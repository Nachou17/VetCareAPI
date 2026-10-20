// ======================================================
// src/components/citas/CitaStatusBadge.tsx
// Selector de Estado Rápido Inline para citas médicas (WCAG 2.2 AA).
// Permite actualizar el estado de la cita con 1 solo clic.
// ======================================================

import { useState } from 'react'
import type { Cita } from '../../types'
import {
  Clock,
  CheckCircle2,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react'

interface CitaStatusBadgeProps {
  cita: Cita
  onStatusChange: (newStatus: 'Pendiente' | 'Confirmada' | 'Realizada' | 'Cancelada') => Promise<void>
  disabled?: boolean
}

type EstadoCita = 'Pendiente' | 'Confirmada' | 'Realizada' | 'Cancelada'

export function CitaStatusBadge({ cita, onStatusChange, disabled = false }: CitaStatusBadgeProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const estado = cita.estado as EstadoCita

  const getStyle = (est: EstadoCita) => {
    switch (est) {
      case 'Pendiente':
        return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
      case 'Confirmada':
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
      case 'Realizada':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
      case 'Cancelada':
        return 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getIcon = (est: EstadoCita) => {
    if (isUpdating) return <Loader2 size={12} className="animate-spin text-current" />
    switch (est) {
      case 'Pendiente':
        return <Clock size={12} className="text-amber-700" />
      case 'Confirmada':
        return <CheckCircle2 size={12} className="text-blue-700" />
      case 'Realizada':
        return <CheckCircle size={12} className="text-emerald-700" />
      case 'Cancelada':
        return <XCircle size={12} className="text-rose-700" />
      default:
        return null
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as EstadoCita
    if (newStatus === estado || isUpdating) return

    setIsUpdating(true)
    try {
      await onStatusChange(newStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all shadow-sm ${getStyle(
          estado,
        )} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {getIcon(estado)}
        <select
          value={estado}
          onChange={handleChange}
          disabled={disabled || isUpdating}
          aria-label={`Cambiar estado de cita #${cita.id}. Estado actual: ${estado}`}
          className="appearance-none bg-transparent font-semibold cursor-pointer focus:outline-none pr-4 text-xs tracking-tight"
        >
          <option value="Pendiente" className="text-gray-900 bg-white">
            Pendiente
          </option>
          <option value="Confirmada" className="text-gray-900 bg-white">
            Confirmada
          </option>
          <option value="Realizada" className="text-gray-900 bg-white">
            Realizada
          </option>
          <option value="Cancelada" className="text-gray-900 bg-white">
            Cancelada
          </option>
        </select>
        <ChevronDown
          size={11}
          className="pointer-events-none absolute right-2.5 opacity-70"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

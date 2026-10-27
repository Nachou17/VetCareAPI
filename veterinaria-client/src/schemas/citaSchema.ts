// ======================================================
// src/schemas/citaSchema.ts
// Validación Zod para formularios de Citas.
// ======================================================

import { z } from 'zod'
import { isPastDateTime } from '../utils/date'

const ESTADOS_VALIDOS = ['Pendiente', 'Confirmada', 'Cancelada', 'Realizada'] as const

export const citaSchema = z.object({
  pacienteId: z
    .number({ invalid_type_error: 'Selecciona un paciente' })
    .int()
    .positive('El paciente es obligatorio'),
  usuarioId: z
    .number({ invalid_type_error: 'Selecciona un veterinario' })
    .int()
    .positive('El veterinario es obligatorio'),
  especialidadId: z
    .number({ invalid_type_error: 'Selecciona una especialidad' })
    .int()
    .positive('La especialidad es obligatoria'),
  fechaHora: z
    .string()
    .min(1, 'La fecha y hora son obligatorias')
    .refine((v) => !isNaN(Date.parse(v)), 'Fecha y hora inválidas')
    .refine((v) => !isPastDateTime(v), 'La fecha y hora de la cita no pueden ser anteriores al momento actual'),
  estado: z.enum(ESTADOS_VALIDOS, {
    errorMap: () => ({ message: 'Estado inválido' }),
  }),
})

export type CitaFormValues = z.infer<typeof citaSchema>

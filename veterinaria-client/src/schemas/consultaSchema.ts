// ======================================================
// src/schemas/consultaSchema.ts
// Validación Zod para el registro de consultas médicas.
// ======================================================

import { z } from 'zod'

export const consultaSchema = z.object({
  pacienteId: z
    .number({ invalid_type_error: 'Selecciona un paciente' })
    .int()
    .positive('El paciente es obligatorio'),
  citaId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  motivo: z
    .string()
    .trim()
    .min(3, 'El motivo debe tener al menos 3 caracteres')
    .max(250, 'El motivo no puede exceder 250 caracteres'),
  diagnostico: z
    .string()
    .trim()
    .max(500, 'El diagnóstico no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
})

export type ConsultaFormValues = z.infer<typeof consultaSchema>

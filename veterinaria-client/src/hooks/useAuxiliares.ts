// ======================================================
// src/hooks/useAuxiliares.ts
// Hooks para consultas de apoyo (Especialidades, Usuarios)
// ======================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { especialidadService } from '../services/especialidadService'
import { usuarioService } from '../services/usuarioService'
import { rolService } from '../services/rolService'
import type { RegisterRequest } from '../types'

export function useEspecialidades() {
  return useQuery({
    queryKey: ['especialidades'],
    queryFn: especialidadService.getAll,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateEspecialidad() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: { nombre: string; costoBase: number }) =>
      especialidadService.create(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['especialidades'] })
    },
  })
}

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: usuarioService.getAll,
    staleTime: 1000 * 60 * 5,
  })
}

export function useRegisterUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: RegisterRequest) => usuarioService.register(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: rolService.getAll,
    staleTime: 1000 * 60 * 5,
  })
}

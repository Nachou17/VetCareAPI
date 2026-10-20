// ======================================================
// src/pages/CitasPage.tsx — GESTIÓN DE CITAS Y AGENDA
//
// Módulo de Citas con TanStack Query y WCAG 2.2 AA:
//   - Filtros por estado y búsqueda por nombre
//   - Cambio de estado rápido con Badges interactivos
//   - Agendamiento y edición interactiva
//   - Notificación Toast accesible
//   - ConfirmDialog accesible
//   - Adaptable a dispositivos móviles y escritorio
// ======================================================

import { useState, useMemo, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  useCitas,
  useCreateCita,
  useUpdateCita,
  useDeleteCita,
} from '../hooks/useCitas'
import { usePacientes } from '../hooks/usePacientes'
import { useUsuarios, useEspecialidades } from '../hooks/useAuxiliares'
import { CitaForm } from '../components/citas/CitaForm'
import { CitaStatusBadge } from '../components/citas/CitaStatusBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Toast, type ToastMessage } from '../components/ui/Toast'
import { SkeletonRow, SkeletonCard } from '../components/ui/SkeletonRow'
import type { Cita } from '../types'
import type { CitaFormValues } from '../schemas/citaSchema'
import { Plus, Pencil, Trash2, Search, RefreshCw, Calendar, Clock } from 'lucide-react'

type Mode = 'list' | 'create' | 'edit'

export function CitasPage() {
  const { user } = useAuth()
  const canWrite = user?.rol === 'Administrador' || user?.rol === 'Veterinario' || user?.rol === 'Recepcionista'
  const canDelete = user?.rol === 'Administrador' || user?.rol === 'Veterinario'

  const { data: citas = [], isLoading, isError, error, refetch } = useCitas()
  const { data: pacientes = [] } = usePacientes()
  const { data: usuarios = [] } = useUsuarios()
  const { data: especialidades = [] } = useEspecialidades()

  const createMutation = useCreateCita()
  const updateMutation = useUpdateCita()
  const deleteMutation = useDeleteCita()

  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Cita | undefined>()
  const [toDelete, setToDelete] = useState<Cita | null>(null)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null)

  // Mapas auxiliares para visualización rápida
  const pacienteMap = useMemo(() => new Map(pacientes.map((p) => [p.id, p])), [pacientes])
  const usuarioMap = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios])
  const especialidadMap = useMemo(() => new Map(especialidades.map((e) => [e.id, e])), [especialidades])

  // Filtrado de citas
  const filteredCitas = useMemo(() => {
    return citas.filter((c) => {
      const matchEstado = filterEstado === 'todos' || c.estado === filterEstado
      const pac = pacienteMap.get(c.pacienteId)?.nombre.toLowerCase() ?? ''
      const vet = usuarioMap.get(c.usuarioId)?.nombreCompleto.toLowerCase() ?? ''
      const q = search.toLowerCase()
      const matchSearch = pac.includes(q) || vet.includes(q) || c.estado.toLowerCase().includes(q)
      return matchEstado && matchSearch
    })
  }, [citas, filterEstado, search, pacienteMap, usuarioMap])

  async function handleCreate(values: CitaFormValues) {
    await createMutation.mutateAsync(values)
    setMode('list')
    setToast({
      id: Date.now().toString(),
      title: 'Cita Agendada',
      message: 'La cita médica ha sido agendada con éxito.',
      type: 'success',
    })
  }

  async function handleUpdate(values: CitaFormValues) {
    if (!editing) return
    await updateMutation.mutateAsync({ id: editing.id, dto: values })
    setMode('list')
    setEditing(undefined)
    setToast({
      id: Date.now().toString(),
      title: 'Cita Modificada',
      message: `Cita #${editing.id} actualizada correctamente.`,
      type: 'success',
    })
  }

  async function handleQuickStatusChange(
    cita: Cita,
    newStatus: 'Pendiente' | 'Confirmada' | 'Realizada' | 'Cancelada',
  ) {
    await updateMutation.mutateAsync({
      id: cita.id,
      dto: {
        pacienteId: cita.pacienteId,
        usuarioId: cita.usuarioId,
        especialidadId: cita.especialidadId,
        fechaHora: cita.fechaHora,
        estado: newStatus,
      },
    })
    setToast({
      id: Date.now().toString(),
      title: 'Estado Actualizado',
      message: `Cita #${cita.id} marcada como "${newStatus}".`,
      type: 'success',
    })
  }

  async function handleDelete() {
    if (!toDelete) return
    await deleteMutation.mutateAsync(toDelete.id)
    const id = toDelete.id
    setToDelete(null)
    setToast({
      id: Date.now().toString(),
      title: 'Cita Eliminada',
      message: `La cita #${id} ha sido cancelada y eliminada.`,
      type: 'info',
    })
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Agenda y Citas Médicas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión y programación de consultas veterinarias</p>
        </div>
        {canWrite && mode === 'list' && (
          <button
            onClick={() => setMode('create')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
          >
            <Plus size={18} aria-hidden="true" />
            Nueva Cita
          </button>
        )}
      </div>

      {/* Formulario Crear / Editar */}
      {mode !== 'list' && (
        <section aria-labelledby="form-heading" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 id="form-heading" className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            {mode === 'create' ? 'Agendar Nueva Cita Médica' : `Modificar Cita #${editing?.id}`}
          </h2>
          <CitaForm
            initial={editing}
            pacientes={pacientes}
            usuarios={usuarios}
            especialidades={especialidades}
            onSubmit={mode === 'create' ? handleCreate : handleUpdate}
            onCancel={() => {
              setMode('list')
              setEditing(undefined)
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </section>
      )}

      {/* Filtros y Búsqueda */}
      {mode === 'list' && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por paciente, profesional o estado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar citas"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              aria-label="Filtrar por estado"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
            >
              <option value="todos">Todos los Estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Confirmada">Confirmada</option>
              <option value="Realizada">Realizada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
        </div>
      )}

      {/* Estados de Carga / Error / Lista */}
      {mode === 'list' && (
        <>
          {isLoading && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <SkeletonRow cols={6} />
              <SkeletonRow cols={6} />
              <SkeletonRow cols={6} />
              <div className="md:hidden space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          )}

          {isError && (
            <div role="alert" className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
              <p className="text-sm text-red-700 font-medium">
                {error instanceof Error ? error.message : 'Error al cargar el listado de citas.'}
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw size={16} /> Reintentar
              </button>
            </div>
          )}

          {!isLoading && !isError && filteredCitas.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-base font-semibold text-gray-900">No se encontraron citas</h3>
              <p className="text-sm text-gray-500 mt-1">
                {search || filterEstado !== 'todos'
                  ? 'Intenta cambiar los filtros o el término de búsqueda.'
                  : 'Aún no hay citas registradas en la agenda.'}
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredCitas.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Fecha y Hora</th>
                      <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Paciente</th>
                      <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Profesional</th>
                      <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Especialidad</th>
                      <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Estado Rápido</th>
                      <th scope="col" className="px-6 py-3 font-semibold text-gray-700 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredCitas.map((c) => {
                      const pac = pacienteMap.get(c.pacienteId)
                      const vet = usuarioMap.get(c.usuarioId)
                      const esp = especialidadMap.get(c.especialidadId)
                      const fechaFormatted = new Date(c.fechaHora).toLocaleString('es-CL', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })

                      return (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium flex items-center gap-2">
                            <Clock size={16} className="text-blue-500 shrink-0" />
                            {fechaFormatted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                            {pac ? `${pac.nombre} (${pac.especie})` : `Paciente #${c.pacienteId}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {vet ? vet.nombreCompleto : `Veterinario #${c.usuarioId}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {esp ? esp.nombre : `Especialidad #${c.especialidadId}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <CitaStatusBadge
                              cita={c}
                              disabled={!canWrite}
                              onStatusChange={(newStatus) => handleQuickStatusChange(c, newStatus)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                            {canWrite && (
                              <button
                                onClick={() => {
                                  setEditing(c)
                                  setMode('edit')
                                }}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                aria-label={`Editar cita #${c.id}`}
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                ref={deleteButtonRef}
                                onClick={() => setToDelete(c)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                aria-label={`Eliminar cita #${c.id}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Cancelar / Eliminar Cita Médica"
        description={`¿Estás seguro de que deseas eliminar la cita #${toDelete?.id}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar Cita"
        cancelLabel="Volver"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        triggerRef={deleteButtonRef}
      />

      {/* Toast de Notificación Accesible */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}

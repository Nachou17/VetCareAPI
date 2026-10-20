// ======================================================
// src/pages/ConsultasPage.tsx — REGISTRO CLÍNICO Y CONSULTAS
//
// Módulo de Consultas Médicas:
//   - Historial de atenciones clínicas
//   - Registro estructurado de motivo y diagnóstico
//   - Vinculación con citas médicas y pacientes
// ======================================================

import { useState, useMemo, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  useConsultas,
  useCreateConsulta,
  useUpdateConsulta,
  useDeleteConsulta,
} from '../hooks/useConsultas'
import { usePacientes } from '../hooks/usePacientes'
import { useCitas } from '../hooks/useCitas'
import { ConsultaForm } from '../components/consultas/ConsultaForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { SkeletonRow, SkeletonCard } from '../components/ui/SkeletonRow'
import type { Consulta } from '../types'
import type { ConsultaFormValues } from '../schemas/consultaSchema'
import { Plus, Pencil, Trash2, Search, RefreshCw, Stethoscope, FileText, ClipboardList } from 'lucide-react'

type Mode = 'list' | 'create' | 'edit'

export function ConsultasPage() {
  const { user } = useAuth()
  const canWrite = user?.rol === 'Administrador' || user?.rol === 'Veterinario'
  const canDelete = user?.rol === 'Administrador' || user?.rol === 'Veterinario'

  const { data: consultas = [], isLoading, isError, error, refetch } = useConsultas()
  const { data: pacientes = [] } = usePacientes()
  const { data: citas = [] } = useCitas()

  const createMutation = useCreateConsulta()
  const updateMutation = useUpdateConsulta()
  const deleteMutation = useDeleteConsulta()

  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Consulta | undefined>()
  const [toDelete, setToDelete] = useState<Consulta | null>(null)
  const [search, setSearch] = useState('')
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null)

  const pacienteMap = useMemo(() => new Map(pacientes.map((p) => [p.id, p])), [pacientes])

  const filteredConsultas = useMemo(() => {
    return consultas.filter((c) => {
      const pac = pacienteMap.get(c.pacienteId)?.nombre.toLowerCase() ?? ''
      const mot = c.motivo.toLowerCase()
      const diag = (c.diagnostico ?? '').toLowerCase()
      const q = search.toLowerCase()
      return pac.includes(q) || mot.includes(q) || diag.includes(q)
    })
  }, [consultas, search, pacienteMap])

  async function handleCreate(values: ConsultaFormValues) {
    await createMutation.mutateAsync({
      pacienteId: values.pacienteId,
      citaId: values.citaId ?? null,
      motivo: values.motivo,
      diagnostico: values.diagnostico || undefined,
    })
    setMode('list')
  }

  async function handleUpdate(values: ConsultaFormValues) {
    if (!editing) return
    await updateMutation.mutateAsync({
      id: editing.id,
      dto: {
        pacienteId: values.pacienteId,
        citaId: values.citaId ?? null,
        motivo: values.motivo,
        diagnostico: values.diagnostico || undefined,
      },
    })
    setMode('list')
    setEditing(undefined)
  }

  async function handleDelete() {
    if (!toDelete) return
    try {
      await deleteMutation.mutateAsync(toDelete.id)
    } catch {
      // Error de restricción 409 o similar es capturado por el interceptor global con Toast accesible
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <header className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase tracking-wider">
            <Stethoscope size={16} aria-hidden="true" />
            <span>Gestión Clínica</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Stethoscope size={26} className="text-emerald-600" aria-hidden="true" />
            Consultas Médicas
          </h1>
          <p className="text-sm text-gray-600 mt-1">Historial clínico y registro de atenciones veterinarias</p>
        </div>
        {canWrite && mode === 'list' && (
          <button
            onClick={() => setMode('create')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
          >
            <Plus size={18} aria-hidden="true" />
            Nueva Consulta
          </button>
        )}
      </header>

      {/* Formulario Crear / Editar */}
      {mode !== 'list' && (
        <section aria-labelledby="form-heading" className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-6 sm:p-8">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 id="form-heading" className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Stethoscope className="text-emerald-600" size={22} />
              {mode === 'create' ? 'Registrar Nueva Atención Médica' : `Modificar Consulta #${editing?.id}`}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Ingreso del motivo, examen clínico y diagnóstico veterinario.
            </p>
          </div>
          <ConsultaForm
            initial={editing}
            pacientes={pacientes}
            citas={citas}
            onSubmit={mode === 'create' ? handleCreate : handleUpdate}
            onCancel={() => {
              setMode('list')
              setEditing(undefined)
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </section>
      )}

      {/* Buscador */}
      {mode === 'list' && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar por paciente, motivo o diagnóstico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar consultas"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
            />
          </div>
        </div>
      )}

      {/* Listado */}
      {mode === 'list' && (
        <>
          {isLoading && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full">
                <tbody>
                  <SkeletonRow cols={4} />
                  <SkeletonRow cols={4} />
                  <SkeletonRow cols={4} />
                </tbody>
              </table>
              <div className="md:hidden p-4 space-y-3">
                <SkeletonCard />
              </div>
            </div>
          )}

          {isError && (
            <div role="alert" className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
              <p className="text-sm text-red-700 font-medium">
                {error instanceof Error ? error.message : 'Error al cargar el historial de consultas.'}
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw size={16} /> Reintentar
              </button>
            </div>
          )}

          {!isLoading && !isError && filteredConsultas.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <Stethoscope className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-base font-semibold text-gray-900">No hay consultas registradas</h3>
              <p className="text-sm text-gray-500 mt-1">
                {search ? 'No se encontraron resultados para la búsqueda ingresada.' : 'Comienza registrando la primera consulta médica.'}
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredConsultas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConsultas.map((c) => {
                const pac = pacienteMap.get(c.pacienteId)
                return (
                  <article
                    key={c.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                          <ClipboardList size={12} /> Consulta #{c.id}
                        </span>
                        {c.citaId && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            Cita #{c.citaId}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-gray-900 mb-1">
                        {pac ? `${pac.nombre} (${pac.especie})` : `Paciente #${c.pacienteId}`}
                      </h3>

                      <div className="mt-3 space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Motivo:</p>
                          <p className="text-sm text-gray-800 font-medium">{c.motivo}</p>
                        </div>

                        {c.diagnostico && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Diagnóstico:</p>
                            <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                              {c.diagnostico}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <FileText size={14} /> Ficha Clínica
                      </span>
                      <div className="flex gap-1">
                        {canWrite && (
                          <button
                            onClick={() => {
                              setEditing(c)
                              setMode('edit')
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            aria-label={`Editar consulta #${c.id}`}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            ref={deleteButtonRef}
                            onClick={() => setToDelete(c)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            aria-label={`Eliminar consulta #${c.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Eliminar Consulta Médica"
        description={`¿Estás seguro de que deseas eliminar la consulta #${toDelete?.id}? Esta acción eliminará el registro de la atención médica.`}
        confirmLabel="Eliminar Consulta"
        cancelLabel="Volver"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        triggerRef={deleteButtonRef}
      />
    </div>
  )
}

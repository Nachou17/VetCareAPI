// ======================================================
// src/pages/RecetasPage.tsx — PRESCRIPCIÓN Y RECETAS MÉDICAS
//
// Módulo de Recetas Médicas Clínicas:
//   - Generación de recetas vinculadas a consultas
//   - Visualización de posología y medicamentos recetados
//   - Vista previa imprimible de receta veterinaria oficial
// ======================================================

import { useState, useMemo, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  useRecetas,
  useDetallesReceta,
  useCreateReceta,
  useAddDetalleReceta,
  useDeleteReceta,
} from '../hooks/useRecetas'
import { useConsultas } from '../hooks/useConsultas'
import { usePacientes } from '../hooks/usePacientes'
import { useInsumos } from '../hooks/useInsumos'
import { RecetaForm } from '../components/recetas/RecetaForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { SkeletonRow, SkeletonCard } from '../components/ui/SkeletonRow'
import type { Receta, DetalleReceta } from '../types'
import type { RecetaFormValues } from '../schemas/recetaSchema'
import { Plus, Trash2, Search, RefreshCw, Pill, Printer, FileCheck } from 'lucide-react'

export function RecetasPage() {
  const { user } = useAuth()
  const canWrite = user?.rol === 'Administrador' || user?.rol === 'Veterinario'
  const canDelete = user?.rol === 'Administrador' || user?.rol === 'Veterinario'

  const { data: recetas = [], isLoading, isError, error, refetch } = useRecetas()
  const { data: detalles = [] } = useDetallesReceta()
  const { data: consultas = [] } = useConsultas()
  const { data: pacientes = [] } = usePacientes()
  const { data: insumos = [] } = useInsumos()

  const createRecetaMutation = useCreateReceta()
  const addDetalleMutation = useAddDetalleReceta()
  const deleteRecetaMutation = useDeleteReceta()

  const [mode, setMode] = useState<'list' | 'create'>('list')
  const [toDelete, setToDelete] = useState<Receta | null>(null)
  const [printReceta, setPrintReceta] = useState<{ receta: Receta; detalle?: DetalleReceta } | null>(null)
  const [search, setSearch] = useState('')
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null)

  // Mapas auxiliares
  const consultaMap = useMemo(() => new Map(consultas.map((c) => [c.id, c])), [consultas])
  const pacienteMap = useMemo(() => new Map(pacientes.map((p) => [p.id, p])), [pacientes])
  const insumoMap = useMemo(() => new Map(insumos.map((i) => [i.id, i])), [insumos])
  const detalleMap = useMemo(() => new Map(detalles.map((d) => [d.recetaId, d])), [detalles])

  // Filtrado
  const filteredRecetas = useMemo(() => {
    return recetas.filter((r) => {
      const consulta = consultaMap.get(r.consultaId)
      const paciente = consulta ? pacienteMap.get(consulta.pacienteId) : undefined
      const det = detalleMap.get(r.id)
      const insumo = det ? insumoMap.get(det.insumoId) : undefined

      const q = search.toLowerCase()
      const pacName = paciente?.nombre.toLowerCase() ?? ''
      const insName = insumo?.nombreProducto.toLowerCase() ?? ''

      return pacName.includes(q) || insName.includes(q) || r.id.toString().includes(q)
    })
  }, [recetas, search, consultaMap, pacienteMap, detalleMap, insumoMap])

  async function handleCreate(values: RecetaFormValues) {
    // 1. Crear cabecera de la receta
    const nuevaReceta = await createRecetaMutation.mutateAsync({
      consultaId: values.consultaId,
      fechaEmision: values.fechaEmision,
      validaHasta: values.validaHasta,
    })

    // 2. Asociar el fármaco/insumo prescrito
    if (nuevaReceta && nuevaReceta.id) {
      await addDetalleMutation.mutateAsync({
        recetaId: nuevaReceta.id,
        insumoId: values.insumoId,
        dosis: values.dosis,
        duracionDias: values.duracionDias,
      })
    }

    setMode('list')
  }

  async function handleDelete() {
    if (!toDelete) return
    await deleteRecetaMutation.mutateAsync(toDelete.id)
    setToDelete(null)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Recetas Médicas</h1>
          <p className="text-sm text-gray-500 mt-1">Prescripción y emisión de recetas clínicas veterinarias</p>
        </div>
        {canWrite && mode === 'list' && (
          <button
            onClick={() => setMode('create')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
          >
            <Plus size={18} aria-hidden="true" />
            Nueva Receta
          </button>
        )}
      </div>

      {/* Formulario Crear Receta */}
      {mode === 'create' && (
        <section aria-labelledby="form-heading" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 id="form-heading" className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Emitir Nueva Receta Veterinaria
          </h2>
          <RecetaForm
            consultas={consultas}
            insumos={insumos}
            pacientes={pacientes}
            onSubmit={handleCreate}
            onCancel={() => setMode('list')}
            isSubmitting={createRecetaMutation.isPending || addDetalleMutation.isPending}
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
              placeholder="Buscar por paciente, medicamento o N° de receta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar recetas"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
            />
          </div>
        </div>
      )}

      {/* Listado de Recetas */}
      {mode === 'list' && (
        <>
          {isLoading && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full">
                <tbody>
                  <SkeletonRow cols={5} />
                  <SkeletonRow cols={5} />
                  <SkeletonRow cols={5} />
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
                {error instanceof Error ? error.message : 'Error al cargar las recetas médicas.'}
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw size={16} /> Reintentar
              </button>
            </div>
          )}

          {!isLoading && !isError && filteredRecetas.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <Pill className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-base font-semibold text-gray-900">No se encontraron recetas</h3>
              <p className="text-sm text-gray-500 mt-1">
                {search ? 'Intenta modificar el término de búsqueda.' : 'Aún no se han emitido recetas médicas.'}
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredRecetas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecetas.map((r) => {
                const con = consultaMap.get(r.consultaId)
                const pac = con ? pacienteMap.get(con.pacienteId) : undefined
                const det = detalleMap.get(r.id)
                const ins = det ? insumoMap.get(det.insumoId) : undefined

                return (
                  <article
                    key={r.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <FileCheck size={12} /> Receta #{r.id}
                        </span>
                        <span className="text-xs text-gray-500">
                          Emitida: {r.fechaEmision}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900">
                        {pac ? `${pac.nombre} (${pac.especie})` : `Paciente Consulta #${r.consultaId}`}
                      </h3>

                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicamento Indicado:</p>
                          <p className="text-sm font-semibold text-blue-700">
                            {ins ? ins.nombreProducto : 'Medicamento prescrito'}
                          </p>
                        </div>

                        {det && (
                          <>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Posología:</p>
                              <p className="text-xs text-gray-700">{det.dosis}</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              Tratamiento: <strong className="text-gray-800">{det.duracionDias} días</strong>
                            </p>
                          </>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        Vigencia hasta: <span className="font-medium text-gray-600">{r.validaHasta}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={() => setPrintReceta({ receta: r, detalle: det })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[36px]"
                        aria-label={`Imprimir receta médica #${r.id}`}
                      >
                        <Printer size={14} /> Imprimir Receta
                      </button>

                      {canDelete && (
                        <button
                          ref={deleteButtonRef}
                          onClick={() => setToDelete(r)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          aria-label={`Eliminar receta #${r.id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modal de Impresión / Vista Previa de Receta */}
      {printReceta && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <span className="text-lg font-bold text-blue-700">🐾 VetCare - Receta Oficial</span>
              <span className="text-xs bg-gray-100 px-2.5 py-1 rounded font-mono">
                Folio #{printReceta.receta.id}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <p>
                <strong>Fecha de Emisión:</strong> {printReceta.receta.fechaEmision}
              </p>
              <p>
                <strong>Válida Hasta:</strong> {printReceta.receta.validaHasta}
              </p>
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
                <p className="font-semibold text-blue-900">Rp / Prescripción:</p>
                <p className="text-gray-900 font-bold">
                  {printReceta.detalle ? insumoMap.get(printReceta.detalle.insumoId)?.nombreProducto : 'Fármaco'}
                </p>
                <p className="text-gray-700">
                  <strong>Indicaciones:</strong> {printReceta.detalle?.dosis ?? 'Según criterio médico'}
                </p>
                <p className="text-gray-700">
                  <strong>Duración:</strong> {printReceta.detalle?.duracionDias ?? 7} días
                </p>
              </div>
              <p className="text-xs text-gray-400 italic text-center pt-2">
                Firma y Timbre Médico Veterinario Colegiado
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-3 border-t">
              <button
                onClick={() => setPrintReceta(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg min-h-[44px]"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 min-h-[44px]"
              >
                <Printer size={16} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Eliminar Receta Médica"
        description={`¿Estás seguro de que deseas eliminar la receta médica #${toDelete?.id}?`}
        confirmLabel="Eliminar Receta"
        cancelLabel="Volver"
        isLoading={deleteRecetaMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        triggerRef={deleteButtonRef}
      />
    </div>
  )
}

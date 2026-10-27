// ======================================================
// src/pages/PacientesPage.tsx — CRUD COMPLETO
//
// Mismo patrón que ClientesPage:
//   - Vista de tarjetas móvil / tabla escritorio
//   - 4 estados: skeleton carga, error+reintentar, vacío, datos
//   - Búsqueda en tiempo real por nombre y especie
//   - Control de acciones por rol
//   - ConfirmDialog accesible para borrado
// ======================================================

import { useState, useMemo, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  usePacientes,
  useCreatePaciente,
  useUpdatePaciente,
  useDeletePaciente,
} from '../hooks/usePacientes'
import { useClientes } from '../hooks/useClientes'
import { PacienteForm } from '../components/pacientes/PacienteForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Pagination } from '../components/ui/Pagination'
import { SkeletonRow, SkeletonCard } from '../components/ui/SkeletonRow'
import { paginateList } from '../utils/pagination'
import type { Paciente } from '../types'
import type { PacienteFormValues } from '../schemas/pacienteSchema'
import { Plus, Pencil, Trash2, Search, RefreshCw, PawPrint, Eye, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

type Mode = 'list' | 'create' | 'edit'

export function PacientesPage() {
  const { user } = useAuth()
  const canWrite = user?.rol === 'Administrador' || user?.rol === 'Veterinario'
  const canDelete = user?.rol === 'Administrador' || user?.rol === 'Veterinario'

  const { data: pacientes, isLoading, isError, error, refetch } = usePacientes()
  const { data: clientes = [] } = useClientes()
  const createMutation = useCreatePaciente()
  const updateMutation = useUpdatePaciente()
  const deleteMutation = useDeletePaciente()

  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Paciente | undefined>()
  const [toDelete, setToDelete] = useState<Paciente | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 8
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null)

  // ── Filtro en tiempo real y orden de recencia ─────────────
  const filtered = useMemo(() => {
    if (!pacientes) return []
    const q = search.toLowerCase().trim()
    const list = pacientes.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.especie.toLowerCase().includes(q) ||
        (p.raza ?? '').toLowerCase().includes(q),
    )
    return list.slice().sort((a, b) => b.id - a.id)
  }, [pacientes, search])

  const { pagedItems, totalPages, totalItems, currentPage } = useMemo(
    () => paginateList(filtered, page, pageSize),
    [filtered, page, pageSize],
  )

  // ── Handlers ─────────────────────────────────────────────
  async function handleCreate(values: PacienteFormValues) {
    await createMutation.mutateAsync({
      clienteId: values.clienteId,
      nombre: values.nombre,
      especie: values.especie,
      raza: values.raza || undefined,
      peso: values.peso,
      alergias: values.alergias || undefined,
    })
    setMode('list')
    setPage(1)
  }

  async function handleUpdate(values: PacienteFormValues) {
    if (!editing) return
    await updateMutation.mutateAsync({
      id: editing.id,
      dto: {
        clienteId: values.clienteId,
        nombre: values.nombre,
        especie: values.especie,
        raza: values.raza || undefined,
        peso: values.peso,
        alergias: values.alergias || undefined,
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

  function startEdit(paciente: Paciente) {
    setEditing(paciente)
    setMode('edit')
  }

  function cancelForm() {
    setMode('list')
    setEditing(undefined)
  }

  // ── Formulario ────────────────────────────────────────────
  if (mode !== 'list') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="border-b border-gray-200 pb-4">
          <button
            onClick={cancelForm}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 mb-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Volver al listado de Pacientes
          </button>
          <div className="flex items-center gap-2 text-cyan-700 font-semibold text-xs uppercase tracking-wider">
            <PawPrint size={16} aria-hidden="true" />
            <span>Gestión Clínica</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1 flex items-center gap-2.5">
            <PawPrint size={26} className="text-cyan-600" aria-hidden="true" />
            {mode === 'create' ? 'Nuevo Paciente (Mascota)' : 'Editar Paciente'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Ficha clínica inicial y datos del propietario asociado en el centro veterinario.
          </p>
        </header>

        <section aria-labelledby="form-paciente-heading">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-lg p-6 sm:p-8">
            <PacienteForm
              initial={mode === 'edit' ? editing : undefined}
              clientes={clientes}
              onSubmit={mode === 'create' ? handleCreate : handleUpdate}
              onCancel={cancelForm}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        </section>
      </div>
    )
  }

  // ── Vista de lista ────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Encabezado */}
      <header className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-700 font-semibold text-xs uppercase tracking-wider">
            <PawPrint size={16} aria-hidden="true" />
            <span>Gestión Clínica</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1 flex items-center gap-2.5">
            <PawPrint size={26} className="text-cyan-600" aria-hidden="true" />
            Pacientes
            {!isLoading && pacientes && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filtered.length} de {pacientes.length})
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Registro de mascotas, fichas de salud e historial de atención clínica.
          </p>
        </div>

        {canWrite && (
          <button
            onClick={() => setMode('create')}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:outline-none"
          >
            <Plus size={16} aria-hidden="true" />
            Nuevo paciente
          </button>
        )}
      </header>

      {/* Barra de búsqueda */}
      <div className="relative mb-4">
        <label htmlFor="search-pacientes" className="sr-only">
          Buscar pacientes por nombre, especie o raza
        </label>
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="search-pacientes"
          type="search"
          placeholder="Buscar por nombre, especie o raza…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-full pl-9 pr-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-controls="pacientes-list"
        />
      </div>

      {/* Estado: cargando */}
      {isLoading && (
        <>
          <div className="md:hidden space-y-3" role="status" aria-label="Cargando pacientes">
            {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
          </div>
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200" role="status">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <tbody className="bg-white divide-y divide-gray-100">
                {[1, 2, 3].map((n) => <SkeletonRow key={n} cols={5} />)}
              </tbody>
            </table>
          </div>
          <p className="sr-only" aria-live="polite">Cargando pacientes, por favor espera.</p>
        </>
      )}

      {/* Estado: error */}
      {isError && (
        <div role="alert" className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-start justify-between gap-4">
          <p className="text-sm">
            {error instanceof Error ? error.message : 'Error al cargar los pacientes.'}
          </p>
          <button
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1 text-sm text-red-700 underline hover:no-underline focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none min-h-[44px] min-w-[44px]"
          >
            <RefreshCw size={14} aria-hidden="true" /> Reintentar
          </button>
        </div>
      )}

      {/* Estado: vacío */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="py-12 text-center" role="status">
          <PawPrint size={40} className="mx-auto mb-3 text-gray-300" aria-hidden="true" />
          <p className="text-gray-500 text-sm">
            {search
              ? `No se encontraron pacientes que coincidan con "${search}".`
              : 'No hay pacientes registrados todavía.'}
          </p>
          {canWrite && !search && (
            <button
              onClick={() => setMode('create')}
              className="mt-4 inline-flex items-center gap-1 text-blue-600 text-sm hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none min-h-[44px]"
            >
              <Plus size={14} aria-hidden="true" /> Crear el primer paciente
            </button>
          )}
        </div>
      )}

      {/* Estado: datos */}
      {!isLoading && !isError && filtered.length > 0 && (
        <section aria-label="Lista de pacientes" id="pacientes-list">
          {/* Tarjetas — móvil */}
          <ul className="md:hidden space-y-3">
            {pagedItems.map((p) => (
              <li key={p.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.nombre}</p>
                    <p className="text-xs text-gray-500">{p.especie}{p.raza ? ` · ${p.raza}` : ''}</p>
                    {p.peso && <p className="text-xs text-gray-400">{p.peso} kg</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      to={`/pacientes/${p.id}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                      aria-label={`Ver detalle de ${p.nombre}`}
                    >
                      <Eye size={16} aria-hidden="true" />
                    </Link>
                    {canWrite && (
                      <button
                        onClick={() => startEdit(p)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                        aria-label={`Editar paciente ${p.nombre}`}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        ref={deleteButtonRef}
                        onClick={() => setToDelete(p)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                        aria-label={`Eliminar paciente ${p.nombre}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Tabla — escritorio */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <caption className="sr-only">Lista de pacientes registrados</caption>
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Nombre</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Especie</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Raza</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Peso (kg)</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Alergias</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {pagedItems.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{p.especie}</td>
                    <td className="px-4 py-3 text-gray-600">{p.raza ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.peso ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{p.alergias ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1 justify-end">
                        <Link
                          to={`/pacientes/${p.id}`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                          aria-label={`Ver detalle de ${p.nombre}`}
                        >
                          <Eye size={15} aria-hidden="true" />
                        </Link>
                        {canWrite && (
                          <button
                            onClick={() => startEdit(p)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                            aria-label={`Editar ${p.nombre}`}
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setToDelete(p)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                            aria-label={`Eliminar ${p.nombre}`}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </section>
      )}

      {/* Modal confirmación */}
      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Eliminar paciente"
        description={`¿Estás seguro de que deseas eliminar a "${toDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setToDelete(null)}
        triggerRef={deleteButtonRef as React.RefObject<HTMLElement>}
      />
    </div>
  )
}

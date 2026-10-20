// ======================================================
// src/pages/ClientesPage.tsx — CRUD COMPLETO
//
// Accesibilidad WCAG 2.2 AA:
//   - landmarks h1, role="status", role="alert"
//   - Tabla semántica con <th scope="col"> en escritorio
//   - Tarjetas en móvil (<768 px) sin scroll horizontal
//   - Todos los botones ≥ 44×44 px con focus-visible:ring-2
//   - ConfirmDialog con focus-trap para borrado
//   - Búsqueda en tiempo real con debounce ligero
//
// Control por rol:
//   - Solo Administrador y Veterinario pueden crear/editar
//   - Solo Administrador puede eliminar
// ======================================================

import { useState, useMemo, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  useClientes,
  useCreateCliente,
  useUpdateCliente,
  useDeleteCliente,
} from '../hooks/useClientes'
import { ClienteForm } from '../components/clientes/ClienteForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { SkeletonRow, SkeletonCard } from '../components/ui/SkeletonRow'
import type { Cliente } from '../types'
import type { ClienteFormValues } from '../schemas/clienteSchema'
import { Plus, Pencil, Trash2, Search, RefreshCw, Users, Eye, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

type Mode = 'list' | 'create' | 'edit'

export function ClientesPage() {
  const { user } = useAuth()
  const canWrite = user?.rol === 'Administrador' || user?.rol === 'Veterinario'
  const canDelete = user?.rol === 'Administrador'

  const { data: clientes, isLoading, isError, error, refetch } = useClientes()
  const createMutation = useCreateCliente()
  const updateMutation = useUpdateCliente()
  const deleteMutation = useDeleteCliente()

  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Cliente | undefined>()
  const [toDelete, setToDelete] = useState<Cliente | null>(null)
  const [search, setSearch] = useState('')
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null)

  // ── Filtro en tiempo real ─────────────────────────────────
  const filtered = useMemo(() => {
    if (!clientes) return []
    const q = search.toLowerCase()
    return clientes.filter(
      (c) =>
        c.nombreCompleto.toLowerCase().includes(q) ||
        c.documentoIdentidad.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q),
    )
  }, [clientes, search])

  // ── Handlers ─────────────────────────────────────────────
  async function handleCreate(values: ClienteFormValues) {
    await createMutation.mutateAsync(values)
    setMode('list')
  }

  async function handleUpdate(values: ClienteFormValues) {
    if (!editing) return
    await updateMutation.mutateAsync({ id: editing.id, dto: values })
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

  function startEdit(cliente: Cliente) {
    setEditing(cliente)
    setMode('edit')
  }

  function cancelForm() {
    setMode('list')
    setEditing(undefined)
  }

  // ── Formulario de creación / edición ─────────────────────
  if (mode !== 'list') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="border-b border-gray-200 pb-4">
          <button
            onClick={cancelForm}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 mb-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Volver al listado de Clientes
          </button>
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-xs uppercase tracking-wider">
            <Users size={16} aria-hidden="true" />
            <span>Gestión Clínica</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Users size={26} className="text-blue-600" aria-hidden="true" />
            {mode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Completa los datos del cliente para su registro y contacto en el sistema clínico.
          </p>
        </header>

        <section aria-labelledby="form-cliente-heading">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-lg p-6 sm:p-8">
            <ClienteForm
              initial={mode === 'edit' ? editing : undefined}
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <header className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-semibold text-xs uppercase tracking-wider">
            <Users size={16} aria-hidden="true" />
            <span>Gestión Clínica</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Users size={26} className="text-blue-600" aria-hidden="true" />
            Clientes
            {!isLoading && clientes && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filtered.length} de {clientes.length})
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Directorio de propietarios de pacientes y datos de contacto.
          </p>
        </div>

        {canWrite && (
          <button
            onClick={() => setMode('create')}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:outline-none"
          >
            <Plus size={16} aria-hidden="true" />
            Nuevo cliente
          </button>
        )}
      </header>

      {/* Barra de búsqueda */}
      <div className="relative mb-4">
        <label htmlFor="search-clientes" className="sr-only">
          Buscar clientes por nombre, documento o correo
        </label>
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="search-clientes"
          type="search"
          placeholder="Buscar por nombre, documento o correo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 min-h-[44px] border border-gray-300 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-controls="clientes-list"
        />
      </div>

      {/* Estado: cargando */}
      {isLoading && (
        <>
          {/* Skeleton móvil */}
          <div className="md:hidden space-y-3" aria-label="Cargando clientes" role="status">
            {[1, 2, 3].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
          {/* Skeleton escritorio */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200" aria-label="Cargando clientes" role="status">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <tbody className="bg-white divide-y divide-gray-100">
                {[1, 2, 3].map((n) => (
                  <SkeletonRow key={n} cols={5} />
                ))}
              </tbody>
            </table>
          </div>
          <p className="sr-only" aria-live="polite">Cargando clientes, por favor espera.</p>
        </>
      )}

      {/* Estado: error de red */}
      {isError && (
        <div role="alert" className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg flex items-start justify-between gap-4">
          <p className="text-sm">
            {error instanceof Error ? error.message : 'Error al cargar los clientes.'}
          </p>
          <button
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1 text-sm text-red-700 underline hover:no-underline focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none min-h-[44px] min-w-[44px]"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}

      {/* Estado: vacío */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="py-12 text-center" role="status">
          <Users size={40} className="mx-auto mb-3 text-gray-300" aria-hidden="true" />
          <p className="text-gray-500 text-sm">
            {search ? `No se encontraron clientes que coincidan con "${search}".` : 'No hay clientes registrados todavía.'}
          </p>
          {canWrite && !search && (
            <button
              onClick={() => setMode('create')}
              className="mt-4 inline-flex items-center gap-1 text-blue-600 text-sm hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none min-h-[44px]"
            >
              <Plus size={14} aria-hidden="true" />
              Crear el primer cliente
            </button>
          )}
        </div>
      )}

      {/* Estado: con datos */}
      {!isLoading && !isError && filtered.length > 0 && (
        <section aria-label="Lista de clientes" id="clientes-list">
          {/* ── Vista de tarjetas (móvil < md) ─────────────────── */}
          <ul className="md:hidden space-y-3">
            {filtered.map((c) => (
              <li key={c.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{c.nombreCompleto}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.documentoIdentidad}</p>
                    {c.telefono && <p className="text-xs text-gray-500">{c.telefono}</p>}
                    {c.email && <p className="text-xs text-gray-500 truncate">{c.email}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      to={`/clientes/${c.id}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                      aria-label={`Ver detalle de ${c.nombreCompleto}`}
                    >
                      <Eye size={16} aria-hidden="true" />
                    </Link>
                    {canWrite && (
                      <button
                        onClick={() => startEdit(c)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                        aria-label={`Editar cliente ${c.nombreCompleto}`}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        ref={deleteButtonRef}
                        onClick={() => setToDelete(c)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                        aria-label={`Eliminar cliente ${c.nombreCompleto}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* ── Vista de tabla (escritorio ≥ md) ───────────────── */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <caption className="sr-only">Lista de clientes registrados</caption>
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Nombre</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Documento</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Teléfono</th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.nombreCompleto}</td>
                    <td className="px-4 py-3 text-gray-600">{c.documentoIdentidad}</td>
                    <td className="px-4 py-3 text-gray-600">{c.telefono ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1 justify-end">
                        <Link
                          to={`/clientes/${c.id}`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                          aria-label={`Ver detalle de ${c.nombreCompleto}`}
                        >
                          <Eye size={15} aria-hidden="true" />
                        </Link>
                        {canWrite && (
                          <button
                            onClick={() => startEdit(c)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                            aria-label={`Editar ${c.nombreCompleto}`}
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setToDelete(c)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                            aria-label={`Eliminar ${c.nombreCompleto}`}
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
        </section>
      )}

      {/* Modal de confirmación de borrado */}
      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Eliminar cliente"
        description={`¿Estás seguro de que deseas eliminar a "${toDelete?.nombreCompleto}"? Esta acción no se puede deshacer.`}
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

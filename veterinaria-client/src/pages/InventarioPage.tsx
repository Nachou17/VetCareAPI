// ======================================================
// src/pages/InventarioPage.tsx — GESTIÓN DE INVENTARIO E INSUMOS
//
// Módulo de Farmacia e Insumos:
//   - Alertas visuales de stock bajo y crítico
//   - KPIs de valorización e inventario
//   - CRUD completo con TanStack Query y WCAG 2.2 AA
// ======================================================

import { useState, useMemo, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  useInsumos,
  useCreateInsumo,
  useUpdateInsumo,
  useDeleteInsumo,
} from '../hooks/useInsumos'
import { InsumoForm } from '../components/inventario/InsumoForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { SkeletonRow, SkeletonCard } from '../components/ui/SkeletonRow'
import type { Insumo } from '../types'
import type { InsumoFormValues } from '../schemas/insumoSchema'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  Package,
  AlertTriangle,
  Boxes,
  TrendingDown,
  CheckCircle,
} from 'lucide-react'

type Mode = 'list' | 'create' | 'edit'

export function InventarioPage() {
  const { user } = useAuth()
  const canWrite = user?.rol === 'Administrador' || user?.rol === 'Veterinario'
  const canDelete = user?.rol === 'Administrador'

  const { data: insumos = [], isLoading, isError, error, refetch } = useInsumos()
  const createMutation = useCreateInsumo()
  const updateMutation = useUpdateInsumo()
  const deleteMutation = useDeleteInsumo()

  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Insumo | undefined>()
  const [toDelete, setToDelete] = useState<Insumo | null>(null)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false)
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null)

  // Métricas del inventario
  const totalItems = insumos.length
  const lowStockCount = useMemo(() => insumos.filter((i) => i.stockActual <= 10).length, [insumos])
  const criticalStockCount = useMemo(() => insumos.filter((i) => i.stockActual <= 5).length, [insumos])
  const totalStockValor = useMemo(
    () => insumos.reduce((acc, i) => acc + i.stockActual * i.precioUnitario, 0),
    [insumos],
  )

  // Tipos únicos para el filtro
  const tiposDisponibles = useMemo(() => {
    const set = new Set(insumos.map((i) => i.tipo))
    return Array.from(set)
  }, [insumos])

  // Filtrado
  const filteredInsumos = useMemo(() => {
    return insumos.filter((i) => {
      const matchTipo = filterTipo === 'todos' || i.tipo === filterTipo
      const matchSearch =
        i.nombreProducto.toLowerCase().includes(search.toLowerCase()) ||
        i.tipo.toLowerCase().includes(search.toLowerCase())
      const matchLowStock = !onlyLowStock || i.stockActual <= 10
      return matchTipo && matchSearch && matchLowStock
    })
  }, [insumos, filterTipo, search, onlyLowStock])

  async function handleCreate(values: InsumoFormValues) {
    await createMutation.mutateAsync(values)
    setMode('list')
  }

  async function handleUpdate(values: InsumoFormValues) {
    if (!editing) return
    await updateMutation.mutateAsync({ id: editing.id, dto: values })
    setMode('list')
    setEditing(undefined)
  }

  async function handleDelete() {
    if (!toDelete) return
    await deleteMutation.mutateAsync(toDelete.id)
    setToDelete(null)
  }

  const getStockBadge = (stock: number) => {
    if (stock <= 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
          <AlertTriangle size={12} /> Crítico ({stock})
        </span>
      )
    }
    if (stock <= 10) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <TrendingDown size={12} /> Bajo ({stock})
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        <CheckCircle size={12} /> Normal ({stock})
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventario y Farmacia</h1>
          <p className="text-sm text-gray-500 mt-1">Control de medicamentos, insumos clínicos y stock disponible</p>
        </div>
        {canWrite && mode === 'list' && (
          <button
            onClick={() => setMode('create')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
          >
            <Plus size={18} aria-hidden="true" />
            Nuevo Insumo
          </button>
        )}
      </div>

      {/* KPI Cards */}
      {mode === 'list' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Boxes size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Catálogo Total</p>
              <p className="text-xl font-bold text-gray-900">{totalItems} productos</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Stock Bajo (≤ 10)</p>
              <p className="text-xl font-bold text-amber-600">{lowStockCount} ítems</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Stock Crítico (≤ 5)</p>
              <p className="text-xl font-bold text-red-600">{criticalStockCount} ítems</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Package size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Valorización</p>
              <p className="text-xl font-bold text-gray-900">${totalStockValor.toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario Crear / Editar */}
      {mode !== 'list' && (
        <section aria-labelledby="form-heading" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 id="form-heading" className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            {mode === 'create' ? 'Registrar Nuevo Insumo / Medicamento' : `Modificar Insumo #${editing?.id}`}
          </h2>
          <InsumoForm
            initial={editing}
            onSubmit={mode === 'create' ? handleCreate : handleUpdate}
            onCancel={() => {
              setMode('list')
              setEditing(undefined)
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </section>
      )}

      {/* Buscador y Filtros */}
      {mode === 'list' && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar insumo por nombre o tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar insumos"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              aria-label="Filtrar por categoría"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
            >
              <option value="todos">Todas las Categorías</option>
              {tiposDisponibles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border min-h-[44px] transition-colors flex items-center gap-1.5 ${
                onlyLowStock
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <AlertTriangle size={15} />
              Solo Stock Bajo
            </button>
          </div>
        </div>
      )}

      {/* Lista / Tabla de Insumos */}
      {mode === 'list' && (
        <>
          {isLoading && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <SkeletonRow cols={5} />
              <SkeletonRow cols={5} />
              <SkeletonRow cols={5} />
              <div className="md:hidden space-y-3">
                <SkeletonCard />
              </div>
            </div>
          )}

          {isError && (
            <div role="alert" className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
              <p className="text-sm text-red-700 font-medium">
                {error instanceof Error ? error.message : 'Error al cargar el inventario.'}
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw size={16} /> Reintentar
              </button>
            </div>
          )}

          {!isLoading && !isError && filteredInsumos.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-base font-semibold text-gray-900">No se encontraron insumos</h3>
              <p className="text-sm text-gray-500 mt-1">
                {search || filterTipo !== 'todos' || onlyLowStock
                  ? 'Prueba modificando los filtros de búsqueda.'
                  : 'Aún no hay productos en el inventario.'}
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredInsumos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Producto</th>
                      <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Categoría</th>
                      <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Stock Actual</th>
                      <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Precio Unitario</th>
                      <th scope="col" className="px-6 py-3 font-semibold text-gray-700 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredInsumos.map((i) => (
                      <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                          {i.nombreProducto}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {i.tipo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStockBadge(i.stockActual)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                          ${i.precioUnitario.toLocaleString('es-CL')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          {canWrite && (
                            <button
                              onClick={() => {
                                setEditing(i)
                                setMode('edit')
                              }}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              aria-label={`Editar insumo ${i.nombreProducto}`}
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              ref={deleteButtonRef}
                              onClick={() => setToDelete(i)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                              aria-label={`Eliminar insumo ${i.nombreProducto}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
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
        title="Eliminar Insumo del Inventario"
        description={`¿Estás seguro de que deseas eliminar "${toDelete?.nombreProducto}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar Insumo"
        cancelLabel="Volver"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        triggerRef={deleteButtonRef}
      />
    </div>
  )
}

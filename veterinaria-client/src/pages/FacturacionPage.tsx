// ======================================================
// src/pages/FacturacionPage.tsx — FACTURACIÓN Y COBROS
//
// Módulo de Facturación Electrónica Veterinaria:
//   - Cálculo automático de IVA (19%) y totales
//   - Desglose por cliente, consulta médica o insumos
//   - Comprobante fiscal y boleta imprimible
// ======================================================

import { useState, useMemo, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  useFacturas,
  useCreateFactura,
  useAddDetalleFactura,
  useDeleteFactura,
} from '../hooks/useFacturas'
import { useClientes } from '../hooks/useClientes'
import { useConsultas } from '../hooks/useConsultas'
import { useInsumos } from '../hooks/useInsumos'
import { FacturaForm } from '../components/facturacion/FacturaForm'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Pagination } from '../components/ui/Pagination'
import { SkeletonRow, SkeletonCard } from '../components/ui/SkeletonRow'
import { paginateList } from '../utils/pagination'
import type { Factura } from '../types'
import type { FacturaFormValues } from '../schemas/facturaSchema'
import {
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Receipt,
  Printer,
  DollarSign,
  TrendingUp,
  Percent,
} from 'lucide-react'

export function FacturacionPage() {
  const { user } = useAuth()
  const canWrite = user?.rol === 'Administrador' || user?.rol === 'Recepcionista' || user?.rol === 'Veterinario'
  const canDelete = user?.rol === 'Administrador'

  const { data: facturas = [], isLoading, isError, error, refetch } = useFacturas()
  const { data: clientes = [] } = useClientes()
  const { data: consultas = [] } = useConsultas()
  const { data: insumos = [] } = useInsumos()

  const createFacturaMutation = useCreateFactura()
  const addDetalleMutation = useAddDetalleFactura()
  const deleteFacturaMutation = useDeleteFactura()

  const [mode, setMode] = useState<'list' | 'create'>('list')
  const [toDelete, setToDelete] = useState<Factura | null>(null)
  const [receiptFactura, setReceiptFactura] = useState<Factura | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 8
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null)

  const clienteMap = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes])

  // KPIs de Facturación
  const totalRecaudado = useMemo(() => facturas.reduce((sum, f) => sum + f.montoTotal, 0), [facturas])
  const totalIva = useMemo(() => facturas.reduce((sum, f) => sum + f.montoImpuestos, 0), [facturas])
  const totalFacturas = facturas.length

  // Filtrado y orden por recencia de emisión descendente
  const filteredFacturas = useMemo(() => {
    const list = facturas.filter((f) => {
      const cli = clienteMap.get(f.clienteId)
      const cliName = cli?.nombreCompleto.toLowerCase() ?? ''
      const doc = cli?.documentoIdentidad.toLowerCase() ?? ''
      const q = search.toLowerCase()
      return cliName.includes(q) || doc.includes(q) || f.id.toString().includes(q)
    })
    return list.slice().sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime() || b.id - a.id)
  }, [facturas, search, clienteMap])

  const { pagedItems, totalPages, totalItems, currentPage } = useMemo(
    () => paginateList(filteredFacturas, page, pageSize),
    [filteredFacturas, page, pageSize],
  )

  async function handleCreate(
    values: FacturaFormValues & { montoImpuestos: number; montoTotal: number },
  ) {
    const nuevaFactura = await createFacturaMutation.mutateAsync({
      clienteId: values.clienteId,
      fechaEmision: values.fechaEmision,
      montoImpuestos: values.montoImpuestos,
      montoTotal: values.montoTotal,
    })

    if (nuevaFactura && nuevaFactura.id) {
      await addDetalleMutation.mutateAsync({
        facturaId: nuevaFactura.id,
        consultaId: values.consultaId ?? null,
        insumoId: values.insumoId ?? null,
        subtotal: values.subtotal,
      })
    }

    setMode('list')
    setPage(1)
  }

  async function handleDelete() {
    if (!toDelete) return
    try {
      await deleteFacturaMutation.mutateAsync(toDelete.id)
    } catch {
      // Error de restricción 409 o similar es capturado por el interceptor global con Toast accesible
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Encabezado */}
      <header className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase tracking-wider">
            <Receipt size={16} aria-hidden="true" />
            <span>Finanzas y Facturación</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Receipt size={26} className="text-emerald-600" aria-hidden="true" />
            Facturación y Cobros
          </h1>
          <p className="text-sm text-gray-600 mt-1">Control de pagos, comprobantes y recaudación clínica</p>
        </div>
        {canWrite && mode === 'list' && (
          <button
            onClick={() => setMode('create')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
          >
            <Plus size={18} aria-hidden="true" />
            Nueva Factura
          </button>
        )}
      </header>

      {/* KPI Cards */}
      {mode === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Recaudación Total</p>
              <p className="text-xl font-bold text-emerald-600">${totalRecaudado.toLocaleString('es-CL')}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Comprobantes Emitidos</p>
              <p className="text-xl font-bold text-gray-900">{totalFacturas} facturas</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Percent size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">IVA Débito (19%)</p>
              <p className="text-xl font-bold text-gray-900">${totalIva.toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario Crear Factura */}
      {mode === 'create' && (
        <section aria-labelledby="form-heading" className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-6 sm:p-8">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 id="form-heading" className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="text-emerald-600" size={22} />
              Emitir Nueva Factura Electrónica
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Cálculo automático de IVA (19%) y detalle de cobro de atenciones o insumos.
            </p>
          </div>
          <FacturaForm
            clientes={clientes}
            consultas={consultas}
            insumos={insumos}
            onSubmit={handleCreate}
            onCancel={() => setMode('list')}
            isSubmitting={createFacturaMutation.isPending || addDetalleMutation.isPending}
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
              placeholder="Buscar por cliente, RUT o folio de factura..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              aria-label="Buscar facturas"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
            />
          </div>
        </div>
      )}

      {/* Listado de Facturas */}
      {mode === 'list' && (
        <>
          {isLoading && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full">
                <tbody>
                  <SkeletonRow cols={6} />
                  <SkeletonRow cols={6} />
                  <SkeletonRow cols={6} />
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
                {error instanceof Error ? error.message : 'Error al cargar las facturas.'}
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw size={16} /> Reintentar
              </button>
            </div>
          )}

          {!isLoading && !isError && filteredFacturas.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-base font-semibold text-gray-900">No se encontraron facturas</h3>
              <p className="text-sm text-gray-500 mt-1">
                {search ? 'Intenta modificar el término de búsqueda.' : 'Aún no se han emitido facturas en el sistema.'}
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredFacturas.length > 0 && (
            <div className="space-y-4">
              {/* ── Vista de Tarjetas para Móviles (< md) ── */}
              <ul className="md:hidden space-y-3" aria-label="Listado móvil de facturación">
                {pagedItems.map((f) => {
                  const cli = clienteMap.get(f.clienteId)
                  return (
                    <li
                      key={f.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="font-mono font-bold text-blue-700 text-sm">
                          Folio #{f.id.toString().padStart(5, '0')}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {f.fechaEmision}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <span className="text-gray-400 block font-medium">Cliente:</span>
                        <span className="text-gray-900 font-semibold block text-sm">
                          {cli ? cli.nombreCompleto : `Cliente #${f.clienteId}`}
                        </span>
                        {cli?.documentoIdentidad && (
                          <span className="text-gray-500 font-mono block">
                            RUT: {cli.documentoIdentidad}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <div>
                          <span className="text-gray-500 block">IVA (19%):</span>
                          <span className="font-medium text-gray-700">${f.montoImpuestos.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 block">Monto Total:</span>
                          <span className="font-bold text-gray-900 text-sm">${f.montoTotal.toLocaleString('es-CL')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setReceiptFactura(f)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg min-h-[36px]"
                          aria-label={`Ver comprobante #${f.id}`}
                        >
                          <Printer size={14} aria-hidden="true" />
                          <span>Comprobante</span>
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            ref={deleteButtonRef}
                            onClick={() => setToDelete(f)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg min-h-[36px]"
                            aria-label={`Anular factura #${f.id}`}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            <span>Anular</span>
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>

              {/* ── Vista de Tabla para Escritorio (≥ md) ── */}
              <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th scope="col" className="px-4 py-3.5 font-semibold">Folio</th>
                        <th scope="col" className="px-4 py-3.5 font-semibold">Cliente / RUT</th>
                        <th scope="col" className="px-4 py-3.5 font-semibold">Fecha</th>
                        <th scope="col" className="px-4 py-3.5 font-semibold">IVA (19%)</th>
                        <th scope="col" className="px-4 py-3.5 font-semibold">Total</th>
                        <th scope="col" className="px-4 py-3.5 font-semibold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {pagedItems.map((f) => {
                        const cli = clienteMap.get(f.clienteId)
                        return (
                          <tr key={f.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-blue-700">
                              #{f.id.toString().padStart(5, '0')}
                            </td>
                            <td className="px-4 py-3.5 text-gray-900 font-medium">
                              {cli ? (
                                <div>
                                  <p>{cli.nombreCompleto}</p>
                                  <p className="text-xs text-gray-400 font-normal">{cli.documentoIdentidad}</p>
                                </div>
                              ) : (
                                `Cliente #${f.clienteId}`
                              )}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">
                              {f.fechaEmision}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-gray-500">
                              ${f.montoImpuestos.toLocaleString('es-CL')}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap font-bold text-gray-900">
                              ${f.montoTotal.toLocaleString('es-CL')}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => setReceiptFactura(f)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[36px] min-w-[36px]"
                                aria-label={`Ver comprobante #${f.id}`}
                              >
                                <Printer size={16} aria-hidden="true" />
                              </button>

                              {canDelete && (
                                <button
                                  type="button"
                                  ref={deleteButtonRef}
                                  onClick={() => setToDelete(f)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[36px] min-w-[36px]"
                                  aria-label={`Anular factura #${f.id}`}
                                >
                                  <Trash2 size={16} aria-hidden="true" />
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

              <Pagination
                page={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                className="px-4 py-4"
              />
            </div>
          )}
        </>
      )}

      {/* Modal Comprobante de Boleta / Factura */}
      {receiptFactura && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 border border-gray-200">
            <div className="text-center border-b pb-4 mb-4">
              <span className="text-xl font-bold text-blue-700 tracking-tight">🐾 VetCare Clínica</span>
              <p className="text-xs text-gray-500 mt-0.5">Comprobante de Boleta Electrónica</p>
              <p className="text-sm font-mono font-bold text-gray-800 mt-2">
                Folio: #{receiptFactura.id.toString().padStart(6, '0')}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Fecha de Emisión:</span>
                <span className="font-medium text-gray-900">{receiptFactura.fechaEmision}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Cliente:</span>
                <span className="font-medium text-gray-900">
                  {clienteMap.get(receiptFactura.clienteId)?.nombreCompleto ?? `Cliente #${receiptFactura.clienteId}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>RUT / Identificación:</span>
                <span className="font-medium text-gray-900">
                  {clienteMap.get(receiptFactura.clienteId)?.documentoIdentidad ?? '-'}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-dashed border-gray-300 space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Monto Neto:</span>
                  <span>
                    ${(receiptFactura.montoTotal - receiptFactura.montoImpuestos).toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA (19%):</span>
                  <span>${receiptFactura.montoImpuestos.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t">
                  <span>TOTAL PAGADO:</span>
                  <span className="text-blue-700">${receiptFactura.montoTotal.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-3 border-t">
              <button
                onClick={() => setReceiptFactura(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg min-h-[44px]"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 min-h-[44px]"
              >
                <Printer size={16} /> Imprimir Comprobante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Anular Factura"
        description={`¿Estás seguro de que deseas anular la factura #${toDelete?.id}? Esta acción registrará la anulación del cobro.`}
        confirmLabel="Anular Factura"
        cancelLabel="Volver"
        isLoading={deleteFacturaMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        triggerRef={deleteButtonRef}
      />
    </div>
  )
}

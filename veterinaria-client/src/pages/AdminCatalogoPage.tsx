// ======================================================
// src/pages/AdminCatalogoPage.tsx
// Módulo de Administración: Catálogo Clínico y Aranceles Base
// Ruta: /admin/catalogo — Solo Administrador
// ======================================================

import { useState, useMemo } from 'react'
import { useEspecialidades, useCreateEspecialidad } from '../hooks/useAuxiliares'
import { Pagination } from '../components/ui/Pagination'
import { SkeletonRow } from '../components/ui/SkeletonRow'
import { paginateList } from '../utils/pagination'
import {
  Award,
  Plus,
  CheckCircle,
  ShieldCheck,
  ArrowLeft,
  DollarSign,
  Tag,
  Search,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function AdminCatalogoPage() {
  const { data: especialidades = [], isLoading: loadingEsp } = useEspecialidades()
  const createEspMutation = useCreateEspecialidad()

  const [espNombre, setEspNombre] = useState('')
  const [espCosto, setEspCosto] = useState<number | ''>(25000)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [espSuccess, setEspSuccess] = useState(false)
  const [espError, setEspError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 6

  // ── Filtro y orden por recencia (ID descendente) ───────────
  const filteredEspecialidades = useMemo(() => {
    const q = search.toLowerCase().trim()
    const list = especialidades.filter((e) => e.nombre.toLowerCase().includes(q))
    return list.slice().sort((a, b) => b.id - a.id)
  }, [especialidades, search])

  const { pagedItems, totalPages, totalItems, currentPage } = useMemo(
    () => paginateList(filteredEspecialidades, page, pageSize),
    [filteredEspecialidades, page, pageSize],
  )

  // ── Validaciones estrictas en cliente ─────────────────────
  const errors = useMemo(() => {
    const errs: Record<string, string> = {}

    const trimmedNombre = espNombre.trim()
    if (!trimmedNombre) {
      errs.espNombre = 'El nombre de la especialidad es obligatorio.'
    } else if (trimmedNombre.length < 3) {
      errs.espNombre = 'Debe tener al menos 3 caracteres.'
    } else if (trimmedNombre.length > 80) {
      errs.espNombre = 'No puede superar los 80 caracteres.'
    }

    if (espCosto === '' || espCosto === undefined) {
      errs.espCosto = 'El arancel base es obligatorio.'
    } else if (Number(espCosto) < 0) {
      errs.espCosto = 'El arancel no puede ser un valor negativo.'
    }

    return errs
  }, [espNombre, espCosto])

  const isFormValid = Object.keys(errors).length === 0

  async function handleCreateEspecialidad(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ espNombre: true, espCosto: true })

    if (!isFormValid || espCosto === '') return

    setEspError('')
    setEspSuccess(false)
    try {
      await createEspMutation.mutateAsync({
        nombre: espNombre.trim(),
        costoBase: Number(espCosto),
      })
      setEspSuccess(true)
      setEspNombre('')
      setEspCosto(25000)
      setTouched({})
      setPage(1)
    } catch {
      setEspError('Error al guardar la especialidad médica. Comprueba los datos.')
    }
  }

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Encabezado alineado con la tarjeta y el contenedor principal ── */}
      <header className="border-b border-gray-200 pb-4">
        <Link
          to="/admin/usuarios"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 mb-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Ir a Personal y Usuarios del Sistema
        </Link>
        <div className="flex items-center gap-2 text-purple-700 font-semibold text-xs uppercase tracking-wider">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Módulo de Sistema y Catálogo</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1 flex items-center gap-2.5">
          <Award size={26} className="text-emerald-600" aria-hidden="true" />
          Catálogo Clínico y Aranceles Base
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Gestión de especialidades médicas, servicios y aranceles base del centro veterinario.
        </p>
      </header>

      {/* ── Tarjeta de Formulario Rediseñada con Sombra y Bordes Suaves ── */}
      <section aria-labelledby="form-catalogo-heading">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-lg">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Plus size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 id="form-catalogo-heading" className="text-lg font-bold text-gray-900">
                Agregar Nueva Especialidad
              </h2>
              <p className="text-xs text-gray-500">
                Define el arancel base referencial en pesos chilenos ($ CLP) para consultas especializadas.
              </p>
            </div>
          </div>

          {espSuccess && (
            <div role="status" className="mb-5 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-xl flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
              <span>Especialidad registrada en el catálogo correctamente.</span>
            </div>
          )}

          {espError && (
            <div role="alert" className="mb-5 p-3.5 bg-red-50 border border-red-300 text-red-700 text-sm rounded-xl animate-in fade-in">
              {espError}
            </div>
          )}

          <form onSubmit={handleCreateEspecialidad} className="space-y-5" noValidate>
            <div>
              <label htmlFor="espNombre" className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Tag size={15} className="text-gray-400" />
                  Nombre de la Especialidad
                  <span aria-hidden="true" className="text-red-500">*</span>
                </span>
                <span className="text-xs font-normal text-gray-400">{espNombre.length}/80</span>
              </label>
              <input
                id="espNombre"
                type="text"
                required
                maxLength={80}
                value={espNombre}
                onChange={(e) => setEspNombre(e.target.value)}
                onBlur={() => markTouched('espNombre')}
                placeholder="Ej: Cirugía Menor, Cardiología, Odontología Veterinaria"
                aria-invalid={touched.espNombre && !!errors.espNombre}
                aria-describedby={touched.espNombre && errors.espNombre ? 'esp-nombre-error' : undefined}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 ${
                  touched.espNombre && errors.espNombre
                    ? 'border-red-400 bg-red-50 focus-visible:ring-red-400'
                    : 'border-gray-300 focus-visible:ring-emerald-500 hover:border-gray-400'
                }`}
              />
              {touched.espNombre && errors.espNombre && (
                <p id="esp-nombre-error" role="alert" className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <span>⚠</span> {errors.espNombre}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="espCosto" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                <DollarSign size={15} className="text-gray-400" />
                Arancel Base ($ CLP)
                <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="espCosto"
                type="number"
                required
                min="0"
                step="1000"
                value={espCosto}
                onChange={(e) => setEspCosto(e.target.value === '' ? '' : Number(e.target.value))}
                onBlur={() => markTouched('espCosto')}
                placeholder="Ej: 25000"
                aria-invalid={touched.espCosto && !!errors.espCosto}
                aria-describedby={touched.espCosto && errors.espCosto ? 'esp-costo-error' : undefined}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 ${
                  touched.espCosto && errors.espCosto
                    ? 'border-red-400 bg-red-50 focus-visible:ring-red-400'
                    : 'border-gray-300 focus-visible:ring-emerald-500 hover:border-gray-400'
                }`}
              />
              {touched.espCosto && errors.espCosto ? (
                <p id="esp-costo-error" role="alert" className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <span>⚠</span> {errors.espCosto}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">Valor de referencia base en pesos chilenos.</p>
              )}
            </div>

            {/* Botón de Envío Bloqueado si el formulario es inválido */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid || createEspMutation.isPending}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:outline-none"
              >
                <Plus size={16} />
                {createEspMutation.isPending ? 'Guardando en el catálogo...' : 'Guardar Especialidad en Catálogo'}
              </button>
              {!isFormValid && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  Completa los campos requeridos correctamente para habilitar el guardado.
                </p>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ── Tabla de Especialidades con Filas Alternadas y Badges Elegantes ── */}
      <section aria-labelledby="tabla-catalogo-heading">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 id="tabla-catalogo-heading" className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <Award size={18} className="text-emerald-600" />
              Especialidades Disponibles ({filteredEspecialidades.length} de {especialidades.length})
            </h2>
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Buscar especialidad..."
                aria-label="Buscar especialidad"
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 min-h-[36px]"
              />
            </div>
          </div>

          {/* ── Vista móvil en tarjetas (< md) ── */}
          <div className="md:hidden p-4">
            {loadingEsp ? (
              <div className="space-y-3" role="status" aria-label="Cargando catálogo">
                <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            ) : pagedItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                {search ? 'No se encontraron especialidades con ese criterio.' : 'No hay especialidades registradas en el catálogo.'}
              </p>
            ) : (
              <ul className="space-y-3" aria-label="Listado móvil de catálogo">
                {pagedItems.map((e) => (
                  <li
                    key={e.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {e.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm truncate">{e.nombre}</span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                        Vigente
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-gray-500 font-medium">Arancel Base:</span>
                      <span className="font-bold text-gray-900 text-sm">${e.costoBase.toLocaleString('es-CL')}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Vista de tabla para escritorio (≥ md) ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-slate-50/90 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Especialidad Clínica</th>
                  <th scope="col" className="px-6 py-3.5">Estado</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Arancel Base ($ CLP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingEsp ? (
                  <SkeletonRow cols={3} />
                ) : pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-400">
                      {search ? 'No se encontraron especialidades con ese criterio.' : 'No hay especialidades registradas en el catálogo.'}
                    </td>
                  </tr>
                ) : (
                  pagedItems.map((e) => (
                    <tr
                      key={e.id}
                      className="odd:bg-white even:bg-slate-50/60 hover:bg-emerald-50/50 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-medium text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {e.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span>{e.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Vigente
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-gray-900">
                        ${e.costoBase.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            className="px-6 py-4 border-t border-gray-200"
          />
        </div>
      </section>
    </div>
  )
}

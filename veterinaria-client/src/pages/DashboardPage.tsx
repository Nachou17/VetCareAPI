// ======================================================
// src/pages/DashboardPage.tsx
// Panel de control clínico VetCare — Métricas integrales de la clínica
// Accesible WCAG 2.2 AA y Mobile-First
// ======================================================

import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useClientes } from '../hooks/useClientes'
import { usePacientes } from '../hooks/usePacientes'
import { useCitas } from '../hooks/useCitas'
import { useInsumos } from '../hooks/useInsumos'
import { useFacturas } from '../hooks/useFacturas'
import {
  PawPrint,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Eye,
  Calendar,
  Package,
  Receipt,
  Pill,
} from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()
  const { data: clientes = [], isLoading: loadingClientes } = useClientes()
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes()
  const { data: citas = [] } = useCitas()
  const { data: insumos = [] } = useInsumos()
  const { data: facturas = [] } = useFacturas()

  const isLoading = loadingClientes || loadingPacientes

  // Métricas
  const totalPacientes = pacientes.length
  const totalClientes = clientes.length
  const citasPendientes = citas.filter((c) => c.estado === 'Pendiente' || c.estado === 'Confirmada').length
  const stockCriticoCount = insumos.filter((i) => i.stockActual <= 10).length
  const totalRecaudado = facturas.reduce((acc, f) => acc + f.montoTotal, 0)

  const ultimosPacientes = [...pacientes].slice(-5).reverse()

  return (
    <div className="space-y-8">
      {/* ── Encabezado de Bienvenida ─────────────────────────── */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Bienvenido, {user?.nombreCompleto}
          </h1>
          <p className="text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-2">
            <span>Sistema Clínico Veterinario VetCare</span>
            <span aria-hidden="true">•</span>
            <span>{totalClientes} tutores registrados</span>
            <span aria-hidden="true">•</span>
            <span>
              Rol activo:{' '}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                {user?.rol}
              </span>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg w-fit">
          <ShieldCheck size={16} aria-hidden="true" className="text-emerald-600" />
          <span>Sesión Segura & Control de Inactividad Activo</span>
        </div>
      </div>

      {/* ── Tarjetas de Resumen (KPIs) ───────────────────────── */}
      <section aria-labelledby="kpis-heading">
        <h2 id="kpis-heading" className="text-lg font-bold text-gray-900 mb-4">
          Indicadores y Métricas Operativas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* KPI 1: Citas Pendientes */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Citas en Agenda
                </p>
                <p className="text-3xl font-extrabold text-blue-900 mt-1">
                  {citasPendientes}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar size={24} />
              </div>
            </div>
            <Link
              to="/citas"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
            >
              Ver agenda clínica <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {/* KPI 2: Pacientes */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pacientes Atendidos
                </p>
                <p className="text-3xl font-extrabold text-blue-900 mt-1">
                  {isLoading ? '…' : totalPacientes}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                <PawPrint size={24} />
              </div>
            </div>
            <Link
              to="/pacientes"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
            >
              Ver directorio de mascotas <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {/* KPI 3: Stock Crítico */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Alertas Stock Bajo
                </p>
                <p className={`text-3xl font-extrabold mt-1 ${stockCriticoCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {stockCriticoCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Package size={24} />
              </div>
            </div>
            <Link
              to="/inventario"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
            >
              Revisar farmacia <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {/* KPI 4: Recaudación Facturada */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Recaudación Total
                </p>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                  ${totalRecaudado.toLocaleString('es-CL')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Receipt size={24} />
              </div>
            </div>
            <Link
              to="/facturacion"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
            >
              Ver facturación <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Accesos Rápidos Directos ─────────────────────────── */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="text-lg font-bold text-gray-900 mb-4">
          Accesos Rápidos a Módulos
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/citas"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group min-h-[44px]"
          >
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Citas</p>
              <p className="text-xs text-gray-500">Agendar cita</p>
            </div>
          </Link>

          <Link
            to="/recetas"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group min-h-[44px]"
          >
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Pill size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Recetas</p>
              <p className="text-xs text-gray-500">Emitir receta</p>
            </div>
          </Link>

          <Link
            to="/inventario"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group min-h-[44px]"
          >
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Package size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Farmacia</p>
              <p className="text-xs text-gray-500">Control de stock</p>
            </div>
          </Link>

          <Link
            to="/facturacion"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group min-h-[44px]"
          >
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Receipt size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Cobros</p>
              <p className="text-xs text-gray-500">Emitir boleta</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Últimos Pacientes Registrados ─────────────────────── */}
      <section aria-labelledby="recent-patients-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="recent-patients-heading" className="text-lg font-bold text-gray-900">
            Últimos Pacientes Registrados
          </h2>
          <Link
            to="/pacientes"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 min-h-[44px] flex items-center"
          >
            Ver todos los pacientes ({totalPacientes})
          </Link>
        </div>

        {ultimosPacientes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            No hay pacientes registrados aún en la clínica.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Nombre</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Especie / Raza</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Peso</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-gray-700">Alergias</th>
                    <th scope="col" className="px-6 py-3 font-semibold text-gray-700 text-right">Ficha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {ultimosPacientes.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {p.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {p.especie} {p.raza ? `(${p.raza})` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {p.peso ? `${p.peso} kg` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.alergias && p.alergias !== 'Ninguna' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            <AlertTriangle size={12} /> {p.alergias}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin registros</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/pacientes/${p.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Eye size={14} /> Ficha
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

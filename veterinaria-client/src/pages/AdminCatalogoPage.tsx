// ======================================================
// src/pages/AdminCatalogoPage.tsx
// Módulo de Administración: Catálogo Clínico y Aranceles Base
// Ruta: /admin/catalogo — Solo Administrador
// ======================================================

import { useState } from 'react'
import { useEspecialidades, useCreateEspecialidad } from '../hooks/useAuxiliares'
import { SkeletonRow } from '../components/ui/SkeletonRow'
import {
  Award,
  Plus,
  CheckCircle,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function AdminCatalogoPage() {
  const { data: especialidades = [], isLoading: loadingEsp } = useEspecialidades()
  const createEspMutation = useCreateEspecialidad()

  const [espNombre, setEspNombre] = useState('')
  const [espCosto, setEspCosto] = useState<number>(25000)
  const [espSuccess, setEspSuccess] = useState(false)
  const [espError, setEspError] = useState('')

  async function handleCreateEspecialidad(e: React.FormEvent) {
    e.preventDefault()
    setEspError('')
    setEspSuccess(false)
    try {
      await createEspMutation.mutateAsync({
        nombre: espNombre,
        costoBase: Number(espCosto),
      })
      setEspSuccess(true)
      setEspNombre('')
      setEspCosto(25000)
    } catch {
      setEspError('Error al guardar la especialidad médica.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <Link
          to="/admin/usuarios"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-600 mb-3 transition-colors"
        >
          <ArrowLeft size={14} />
          Ver también: Personal y Usuarios del Sistema
        </Link>
        <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
          <ShieldCheck size={18} />
          <span>Sistema — Administración</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1 flex items-center gap-2">
          <Award size={24} className="text-emerald-600" />
          Catálogo Clínico y Aranceles Base
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestión de especialidades médicas, servicios y aranceles base del centro veterinario.
        </p>
      </div>

      <div className="space-y-6">
        {/* Formulario centrado con max-w */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-md space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Plus size={18} className="text-emerald-600" />
              Agregar Nueva Especialidad
            </h2>

            {espSuccess && (
              <div role="status" className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle size={16} />
                Especialidad guardada correctamente.
              </div>
            )}
            {espError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg">
                {espError}
              </div>
            )}

            <form onSubmit={handleCreateEspecialidad} className="space-y-4" noValidate>
              <div>
                <label htmlFor="espNombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Especialidad <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <input
                  id="espNombre"
                  type="text"
                  required
                  value={espNombre}
                  onChange={(e) => setEspNombre(e.target.value)}
                  placeholder="Ej: Cirugía Menor, Dermatología, Odontología Veterinaria"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="espCosto" className="block text-sm font-medium text-gray-700 mb-1">
                  Arancel Base ($ CLP) <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <input
                  id="espCosto"
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={espCosto}
                  onChange={(e) => setEspCosto(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">Valor de referencia base en pesos chilenos (CLP).</p>
              </div>

              <button
                type="submit"
                disabled={createEspMutation.isPending}
                className="w-full mt-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:outline-none"
              >
                <Plus size={15} />
                {createEspMutation.isPending ? 'Guardando...' : 'Guardar Especialidad'}
              </button>
            </form>
          </div>
        </div>

        {/* Tabla de especialidades — ancho completo */}
        <section aria-labelledby="tabla-especialidades-heading">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 id="tabla-especialidades-heading" className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Award size={16} className="text-emerald-600" />
                Especialidades Disponibles ({especialidades.length})
              </h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold text-gray-600">Especialidad</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-gray-600 text-right">Arancel Base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loadingEsp ? (
                  <SkeletonRow cols={2} />
                ) : especialidades.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-sm text-gray-400">
                      No hay especialidades registradas.
                    </td>
                  </tr>
                ) : (
                  especialidades.map((e) => (
                    <tr key={e.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{e.nombre}</td>
                      <td className="px-5 py-3 text-right font-bold text-gray-800">
                        ${e.costoBase.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

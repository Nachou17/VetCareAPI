// ======================================================
// src/pages/PacienteDetailPage.tsx
// Detalle de Paciente con vinculación al Cliente propietario
// ======================================================

import { useParams, Link } from 'react-router-dom'
import { usePaciente } from '../hooks/usePacientes'
import { useCliente } from '../hooks/useClientes'
import { ArrowLeft, PawPrint, User, Scale, ShieldAlert, Tag } from 'lucide-react'

export function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pacienteId = Number(id)

  const { data: paciente, isLoading, isError } = usePaciente(pacienteId)
  const { data: cliente, isLoading: loadingCliente } = useCliente(paciente?.clienteId ?? 0)

  return (
    <div className="max-w-4xl space-y-6">
      {/* Botón Volver con tamaño táctil adecuado */}
      <Link
        to="/pacientes"
        className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Volver a Pacientes
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
          <PawPrint size={24} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isLoading ? 'Cargando paciente…' : paciente?.nombre ?? 'Paciente no encontrado'}
          </h1>
          <p className="text-sm text-gray-500">
            {paciente ? `${paciente.especie}${paciente.raza ? ` · ${paciente.raza}` : ''}` : 'Ficha médica y datos generales'}
          </p>
        </div>
      </div>

      {isLoading && (
        <div role="status" aria-live="polite" className="p-6 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500 animate-pulse">Cargando información del paciente…</p>
        </div>
      )}

      {isError && (
        <div role="alert" className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg">
          No se pudo cargar la información del paciente.
        </div>
      )}

      {paciente && (
        <>
          {/* Datos del Paciente */}
          <section aria-label="Información del paciente" className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">
              Ficha del Paciente
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Tag size={18} className="text-gray-400 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">ID de Paciente</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">#{paciente.id}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <PawPrint size={18} className="text-gray-400 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Especie y Raza</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {paciente.especie} {paciente.raza ? `(${paciente.raza})` : ''}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Scale size={18} className="text-gray-400 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Peso</dt>
                  <dd className="mt-0.5 text-sm text-gray-900">
                    {paciente.peso ? `${paciente.peso} kg` : 'No registrado'}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldAlert size={18} className="text-gray-400 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Alergias o Observaciones</dt>
                  <dd className="mt-0.5 text-sm text-gray-900">
                    {paciente.alergias ? paciente.alergias : 'Sin alergias registradas'}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          {/* Propietario / Cliente Asociado */}
          <section aria-label="Propietario del paciente" className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
              <User size={18} className="text-blue-600" aria-hidden="true" />
              Propietario Responsable
            </h2>

            {loadingCliente && (
              <p className="text-sm text-gray-500 py-2 animate-pulse">Cargando datos del propietario…</p>
            )}

            {cliente && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-semibold text-gray-900">{cliente.nombreCompleto}</p>
                  <p className="text-xs text-gray-500">Documento: {cliente.documentoIdentidad}</p>
                  {cliente.telefono && <p className="text-xs text-gray-500">Teléfono: {cliente.telefono}</p>}
                  {cliente.email && <p className="text-xs text-gray-500">Email: {cliente.email}</p>}
                </div>
                <Link
                  to={`/clientes/${cliente.id}`}
                  className="min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:outline-none"
                >
                  Ver ficha de cliente
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

// ======================================================
// src/pages/ClienteDetailPage.tsx
// Detalle de Cliente con listado de sus Pacientes (recurso relacionado)
// ======================================================

import { useParams, Link } from 'react-router-dom'
import { useCliente } from '../hooks/useClientes'
import { usePacientes } from '../hooks/usePacientes'
import { ArrowLeft, User, PawPrint, Phone, Mail, CreditCard } from 'lucide-react'

export function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const clienteId = Number(id)

  const { data: cliente, isLoading: loadingCliente, isError: errorCliente } = useCliente(clienteId)
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes()

  const pacientesDelCliente = pacientes.filter((p) => p.clienteId === clienteId)

  return (
    <div className="max-w-4xl space-y-6">
      {/* Botón Volver con tamaño táctil adecuado */}
      <Link
        to="/clientes"
        className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Volver a Clientes
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
          <User size={24} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {loadingCliente ? 'Cargando cliente…' : cliente?.nombreCompleto ?? 'Cliente no encontrado'}
          </h1>
          <p className="text-sm text-gray-500">Detalles de contacto y mascotas registradas</p>
        </div>
      </div>

      {loadingCliente && (
        <div role="status" aria-live="polite" className="p-6 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500 animate-pulse">Cargando información del cliente…</p>
        </div>
      )}

      {errorCliente && (
        <div role="alert" className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg">
          No se pudo cargar la información del cliente.
        </div>
      )}

      {cliente && (
        <section aria-label="Información del cliente" className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">
            Datos Generales
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CreditCard size={18} className="text-gray-400 mt-0.5" aria-hidden="true" />
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Documento de Identidad</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">{cliente.documentoIdentidad}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User size={18} className="text-gray-400 mt-0.5" aria-hidden="true" />
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre Completo</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">{cliente.nombreCompleto}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone size={18} className="text-gray-400 mt-0.5" aria-hidden="true" />
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Teléfono</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{cliente.telefono ?? 'No registrado'}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail size={18} className="text-gray-400 mt-0.5" aria-hidden="true" />
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Correo Electrónico</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{cliente.email ?? 'No registrado'}</dd>
              </div>
            </div>
          </dl>
        </section>
      )}

      {/* Recurso Relacionado: Mascotas / Pacientes */}
      <section aria-label="Mascotas del cliente" className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <PawPrint size={18} className="text-blue-600" aria-hidden="true" />
            Mascotas Asociadas ({pacientesDelCliente.length})
          </h2>
          <Link
            to="/pacientes"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none p-1"
          >
            Ver todos los pacientes →
          </Link>
        </div>

        {loadingPacientes && (
          <p className="text-sm text-gray-500 py-4 animate-pulse">Cargando pacientes asociados…</p>
        )}

        {!loadingPacientes && pacientesDelCliente.length === 0 && (
          <p className="text-sm text-gray-500 py-4">Este cliente aún no tiene mascotas registradas.</p>
        )}

        {!loadingPacientes && pacientesDelCliente.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pacientesDelCliente.map((p) => (
              <li key={p.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{p.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {p.especie}{p.raza ? ` · ${p.raza}` : ''}{p.peso ? ` · ${p.peso} kg` : ''}
                  </p>
                </div>
                <Link
                  to={`/pacientes/${p.id}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  aria-label={`Ver detalles de ${p.nombre}`}
                >
                  Detalles
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

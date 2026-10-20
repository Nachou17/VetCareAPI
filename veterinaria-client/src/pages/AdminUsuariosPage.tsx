// ======================================================
// src/pages/AdminUsuariosPage.tsx
// Módulo de Administración: Personal y Usuarios del Sistema
// Ruta: /admin/usuarios — Solo Administrador
// ======================================================

import { useState } from 'react'
import { useUsuarios, useRegisterUsuario, useRoles } from '../hooks/useAuxiliares'
import { SkeletonRow } from '../components/ui/SkeletonRow'
import {
  ShieldCheck,
  UserPlus,
  Users,
  Key,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function AdminUsuariosPage() {
  const { data: usuarios = [], isLoading: loadingUsers } = useUsuarios()
  const { data: roles = [] } = useRoles()
  const registerMutation = useRegisterUsuario()

  const [nombreCompleto, setNombreCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rolId, setRolId] = useState<number>(roles[0]?.id ?? 2)
  const [userSuccess, setUserSuccess] = useState(false)
  const [userError, setUserError] = useState('')

  async function handleRegisterUser(e: React.FormEvent) {
    e.preventDefault()
    setUserError('')
    setUserSuccess(false)
    try {
      await registerMutation.mutateAsync({
        nombreCompleto,
        email,
        password,
        rolId: Number(rolId),
      })
      setUserSuccess(true)
      setNombreCompleto('')
      setEmail('')
      setPassword('')
    } catch {
      setUserError('Error al crear el usuario. Comprueba que el correo no esté duplicado.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <Link
          to="/admin/catalogo"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 mb-3 transition-colors"
        >
          <ArrowLeft size={14} />
          Ver también: Catálogo Clínico y Aranceles
        </Link>
        <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
          <ShieldCheck size={18} />
          <span>Sistema — Administración</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1 flex items-center gap-2">
          <Users size={24} className="text-blue-600" />
          Personal y Usuarios del Sistema
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestión de credenciales de acceso y asignación de roles del personal del centro.
        </p>
      </div>

      {/* Contenido principal: form centrado + tabla */}
      <div className="space-y-6">
        {/* Formulario de nuevo usuario — centrado con max-w */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-md space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <UserPlus size={18} className="text-blue-600" />
              Crear Nueva Cuenta de Personal
            </h2>

            {userSuccess && (
              <div role="status" className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle size={16} />
                Usuario registrado exitosamente.
              </div>
            )}
            {userError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg">
                {userError}
              </div>
            )}

            <form onSubmit={handleRegisterUser} className="space-y-4" noValidate>
              <div>
                <label htmlFor="nombreCompleto" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <input
                  id="nombreCompleto"
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej: Dra. Camila Soto"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="camila@veterinaria.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rolId" className="block text-sm font-medium text-gray-700 mb-1">
                    Rol de Acceso <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <select
                    id="rolId"
                    value={rolId}
                    onChange={(e) => setRolId(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña Inicial <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full mt-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:outline-none"
              >
                <Key size={15} />
                {registerMutation.isPending ? 'Registrando...' : 'Registrar Personal'}
              </button>
            </form>
          </div>
        </div>

        {/* Tabla de usuarios — ancho completo */}
        <section aria-labelledby="tabla-usuarios-heading">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 id="tabla-usuarios-heading" className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                Personal Activo ({usuarios.length})
              </h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold text-gray-600">Nombre</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-gray-600">Email</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-gray-600">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loadingUsers ? (
                  <SkeletonRow cols={3} />
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-400">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{u.nombreCompleto}</td>
                      <td className="px-5 py-3 text-gray-500">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.rol === 'Administrador'
                            ? 'bg-purple-100 text-purple-800'
                            : u.rol === 'Veterinario'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.rol}
                        </span>
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

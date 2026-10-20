// ======================================================
// src/pages/AdministracionPage.tsx — CONFIGURACIÓN Y ADMINISTRACIÓN
//
// Módulo de Administración del Sistema (Rol: Administrador):
//   - Gestión de usuarios del sistema y asignación de roles
//   - Catálogo de especialidades clínicas y aranceles base
//   - Auditoría y parámetros del sistema
// ======================================================

import { useState } from 'react'
import {
  useUsuarios,
  useRegisterUsuario,
  useRoles,
  useEspecialidades,
  useCreateEspecialidad,
} from '../hooks/useAuxiliares'
import { SkeletonRow } from '../components/ui/SkeletonRow'
import {
  ShieldCheck,
  UserPlus,
  Users,
  Award,
  Plus,
  Key,
  CheckCircle,
} from 'lucide-react'

export function AdministracionPage() {
  const { data: usuarios = [], isLoading: loadingUsers } = useUsuarios()
  const { data: roles = [] } = useRoles()
  const { data: especialidades = [], isLoading: loadingEsp } = useEspecialidades()

  const registerMutation = useRegisterUsuario()
  const createEspMutation = useCreateEspecialidad()

  // Formulario de Usuario
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rolId, setRolId] = useState<number>(roles[0]?.id ?? 2)
  const [userSuccess, setUserSuccess] = useState(false)
  const [userError, setUserError] = useState('')

  // Formulario de Especialidad
  const [espNombre, setEspNombre] = useState('')
  const [espCosto, setEspCosto] = useState<number>(25000)
  const [espSuccess, setEspSuccess] = useState(false)
  const [espError, setEspError] = useState('')

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
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
          <ShieldCheck size={18} />
          <span>Panel de Control Maestro</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
          Administración y Configuración del Sistema
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestión de credenciales de acceso, asignación de roles y catálogo clínico
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECCIÓN 1: Gestión de Usuarios */}
        <section aria-labelledby="usuarios-heading" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <Users className="text-blue-600" size={20} />
            <h2 id="usuarios-heading" className="text-lg font-bold text-gray-900">
              Personal y Usuarios del Sistema
            </h2>
          </div>

          {/* Formulario nuevo usuario */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <UserPlus size={16} /> Crear Nueva Cuenta de Personal
            </h3>

            {userSuccess && (
              <div role="status" className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle size={14} /> Usuario registrado exitosamente.
              </div>
            )}

            {userError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs rounded-lg">
                {userError}
              </div>
            )}

            <form onSubmit={handleRegisterUser} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej: Dra. Camila Soto"
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="camila@veterinaria.com"
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">Rol de Acceso</label>
                  <select
                    value={rolId}
                    onChange={(e) => setRolId(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700">Contraseña Inicial</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Key size={15} />
                {registerMutation.isPending ? 'Registrando...' : 'Registrar Personal'}
              </button>
            </form>
          </div>

          {/* Tabla de usuarios */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Personal Activo ({usuarios.length})
              </h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-semibold text-gray-600">Nombre</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loadingUsers ? (
                  <SkeletonRow cols={3} />
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{u.nombreCompleto}</td>
                      <td className="px-4 py-2.5 text-gray-500">{u.email}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
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

        {/* SECCIÓN 2: Catálogo de Especialidades */}
        <section aria-labelledby="especialidades-heading" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <Award className="text-emerald-600" size={20} />
            <h2 id="especialidades-heading" className="text-lg font-bold text-gray-900">
              Catálogo Clínico y Aranceles Base
            </h2>
          </div>

          {/* Formulario nueva especialidad */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Plus size={16} /> Agregar Nueva Especialidad
            </h3>

            {espSuccess && (
              <div role="status" className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle size={14} /> Especialidad guardada correctamente.
              </div>
            )}

            {espError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs rounded-lg">
                {espError}
              </div>
            )}

            <form onSubmit={handleCreateEspecialidad} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700">Nombre de Especialidad</label>
                <input
                  type="text"
                  required
                  value={espNombre}
                  onChange={(e) => setEspNombre(e.target.value)}
                  placeholder="Ej: Cirugía Menor, Dermatología, Odontología"
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Arancel Base ($ CLP)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={espCosto}
                  onChange={(e) => setEspCosto(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={createEspMutation.isPending}
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={15} />
                {createEspMutation.isPending ? 'Guardando...' : 'Guardar Especialidad'}
              </button>
            </form>
          </div>

          {/* Tabla de especialidades */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Especialidades Disponibles ({especialidades.length})
              </h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-semibold text-gray-600">Especialidad</th>
                  <th className="px-4 py-2 font-semibold text-gray-600 text-right">Arancel Base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loadingEsp ? (
                  <SkeletonRow cols={2} />
                ) : (
                  especialidades.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{e.nombre}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-800">
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

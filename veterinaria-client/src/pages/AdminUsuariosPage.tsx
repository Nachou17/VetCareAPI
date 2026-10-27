// ======================================================
// src/pages/AdminUsuariosPage.tsx
// Módulo de Administración: Personal y Usuarios del Sistema
// Ruta: /admin/usuarios — Solo Administrador
// ======================================================

import { useState, useMemo, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUsuarios, useRegisterUsuario, useRoles, useDeleteUsuario } from '../hooks/useAuxiliares'
import { Pagination } from '../components/ui/Pagination'
import { SkeletonRow } from '../components/ui/SkeletonRow'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { paginateList } from '../utils/pagination'
import type { UsuarioAuth } from '../types'
import {
  ShieldCheck,
  UserPlus,
  Users,
  Key,
  CheckCircle,
  ArrowLeft,
  Mail,
  User,
  Lock,
  Search,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function AdminUsuariosPage() {
  const { user: currentUser } = useAuth()
  const { data: usuarios = [], isLoading: loadingUsers } = useUsuarios()
  const { data: roles = [] } = useRoles()
  const registerMutation = useRegisterUsuario()
  const deleteMutation = useDeleteUsuario()

  // ── Regla de seguridad: Solo permitir registrar roles Veterinario y Recepcionista ──
  const assignableRoles = useMemo(
    () => roles.filter((r) => r.nombre !== 'Administrador'),
    [roles],
  )

  const [nombreCompleto, setNombreCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rolId, setRolId] = useState<number>(2)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [userSuccess, setUserSuccess] = useState(false)
  const [userError, setUserError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [toDelete, setToDelete] = useState<UsuarioAuth | null>(null)
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 6

  // Asegura que rolId pertenezca a los roles asignables disponibles
  useEffect(() => {
    if (assignableRoles.length > 0 && !assignableRoles.some((r) => r.id === rolId)) {
      setRolId(assignableRoles[0].id)
    }
  }, [assignableRoles, rolId])

  // ── Filtro y orden por recencia (ID descendente) ───────────
  const filteredUsuarios = useMemo(() => {
    const q = search.toLowerCase().trim()
    const list = usuarios.filter(
      (u) =>
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.rol.toLowerCase().includes(q),
    )
    return list.slice().sort((a, b) => b.id - a.id)
  }, [usuarios, search])

  const { pagedItems, totalPages, totalItems, currentPage } = useMemo(
    () => paginateList(filteredUsuarios, page, pageSize),
    [filteredUsuarios, page, pageSize],
  )

  // ── Validaciones estrictas en cliente ─────────────────────
  const errors = useMemo(() => {
    const errs: Record<string, string> = {}

    // Nombre completo
    const trimmedNombre = nombreCompleto.trim()
    if (!trimmedNombre) {
      errs.nombreCompleto = 'El nombre completo es obligatorio.'
    } else if (trimmedNombre.length < 3) {
      errs.nombreCompleto = 'El nombre debe tener al menos 3 caracteres.'
    } else if (trimmedNombre.length > 80) {
      errs.nombreCompleto = 'El nombre no puede exceder los 80 caracteres.'
    }

    // Email
    const trimmedEmail = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!trimmedEmail) {
      errs.email = 'El correo electrónico es obligatorio.'
    } else if (trimmedEmail.length > 100) {
      errs.email = 'El correo no puede exceder los 100 caracteres.'
    } else if (!emailRegex.test(trimmedEmail)) {
      errs.email = 'Ingresa un formato de correo electrónico válido (ej: usuario@veterinaria.com).'
    }

    // Password
    if (!password) {
      errs.password = 'La contraseña es obligatoria.'
    } else if (password.length < 6) {
      errs.password = 'La contraseña debe tener al menos 6 caracteres.'
    }

    return errs
  }, [nombreCompleto, email, password])

  const isFormValid = Object.keys(errors).length === 0

  async function handleRegisterUser(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ nombreCompleto: true, email: true, password: true })

    if (!isFormValid) return

    setUserError('')
    setUserSuccess(false)
    try {
      await registerMutation.mutateAsync({
        nombreCompleto: nombreCompleto.trim(),
        email: email.trim().toLowerCase(),
        password,
        rolId: Number(rolId),
      })
      setUserSuccess(true)
      setNombreCompleto('')
      setEmail('')
      setPassword('')
      setTouched({})
      setPage(1)
    } catch {
      setUserError('Error al crear el usuario. Comprueba que el correo no esté duplicado en el sistema.')
    }
  }

  async function handleDeleteConfirm() {
    if (!toDelete) return
    setDeleteError('')
    setDeleteSuccess('')
    try {
      await deleteMutation.mutateAsync(toDelete.id)
      setDeleteSuccess(`Cuenta de "${toDelete.nombreCompleto}" eliminada exitosamente.`)
      setToDelete(null)
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'No fue posible eliminar el usuario.'
      setDeleteError(msg)
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
          to="/admin/catalogo"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 mb-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Ir a Catálogo Clínico y Aranceles Base
        </Link>
        <div className="flex items-center gap-2 text-purple-700 font-semibold text-xs uppercase tracking-wider">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Módulo de Sistema y Seguridad</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1 flex items-center gap-2.5">
          <Users size={26} className="text-blue-600" aria-hidden="true" />
          Personal y Usuarios del Sistema
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Gestión de credenciales de acceso, asignación de roles y control del personal clínico.
        </p>
      </header>

      {/* ── Tarjeta de Formulario Rediseñada con Sombra y Bordes Suaves ── */}
      <section aria-labelledby="form-personal-heading">
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-lg">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <UserPlus size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 id="form-personal-heading" className="text-lg font-bold text-gray-900">
                Registrar Nuevo Personal
              </h2>
              <p className="text-xs text-gray-500">
                Crea una cuenta autorizada para médicos veterinarios o recepcionistas del centro.
              </p>
            </div>
          </div>

          {userSuccess && (
            <div role="status" className="mb-5 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-xl flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
              <span>Personal registrado y acreditado exitosamente.</span>
            </div>
          )}

          {userError && (
            <div role="alert" className="mb-5 p-3.5 bg-red-50 border border-red-300 text-red-700 text-sm rounded-xl animate-in fade-in">
              {userError}
            </div>
          )}

          <form onSubmit={handleRegisterUser} className="space-y-5" noValidate>
            {/* Nombre Completo */}
            <div>
              <label htmlFor="nombreCompleto" className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <User size={15} className="text-gray-400" />
                  Nombre Completo
                  <span aria-hidden="true" className="text-red-500">*</span>
                </span>
                <span className="text-xs font-normal text-gray-400">{nombreCompleto.length}/80</span>
              </label>
              <input
                id="nombreCompleto"
                type="text"
                required
                maxLength={80}
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                onBlur={() => markTouched('nombreCompleto')}
                placeholder="Ej: Dra. Camila Soto Valenzuela"
                aria-invalid={touched.nombreCompleto && !!errors.nombreCompleto}
                aria-describedby={touched.nombreCompleto && errors.nombreCompleto ? 'nombre-error' : undefined}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 ${
                  touched.nombreCompleto && errors.nombreCompleto
                    ? 'border-red-400 bg-red-50 focus-visible:ring-red-400'
                    : 'border-gray-300 focus-visible:ring-blue-500 hover:border-gray-400'
                }`}
              />
              {touched.nombreCompleto && errors.nombreCompleto && (
                <p id="nombre-error" role="alert" className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <span>⚠</span> {errors.nombreCompleto}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <Mail size={15} className="text-gray-400" />
                  Correo Electrónico
                  <span aria-hidden="true" className="text-red-500">*</span>
                </span>
                <span className="text-xs font-normal text-gray-400">{email.length}/100</span>
              </label>
              <input
                id="email"
                type="email"
                required
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched('email')}
                placeholder="camila.soto@veterinaria.com"
                aria-invalid={touched.email && !!errors.email}
                aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 ${
                  touched.email && errors.email
                    ? 'border-red-400 bg-red-50 focus-visible:ring-red-400'
                    : 'border-gray-300 focus-visible:ring-blue-500 hover:border-gray-400'
                }`}
              />
              {touched.email && errors.email && (
                <p id="email-error" role="alert" className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <span>⚠</span> {errors.email}
                </p>
              )}
            </div>

            {/* Rol y Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rolId" className="block text-sm font-semibold text-gray-700 mb-1">
                  Rol de Acceso <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <select
                  id="rolId"
                  value={rolId}
                  onChange={(e) => setRolId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                >
                  {assignableRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="password" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1">
                  <Lock size={15} className="text-gray-400" />
                  Contraseña Inicial <span aria-hidden="true" className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched('password')}
                  placeholder="Mínimo 6 caracteres"
                  aria-invalid={touched.password && !!errors.password}
                  aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 ${
                    touched.password && errors.password
                      ? 'border-red-400 bg-red-50 focus-visible:ring-red-400'
                      : 'border-gray-300 focus-visible:ring-blue-500 hover:border-gray-400'
                  }`}
                />
                {touched.password && errors.password && (
                  <p id="password-error" role="alert" className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                    <span>⚠</span> {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Botón de Envío Bloqueado si el formulario es inválido */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid || registerMutation.isPending}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:outline-none"
              >
                <Key size={16} />
                {registerMutation.isPending ? 'Registrando en el sistema...' : 'Registrar Personal Clínico'}
              </button>
              {!isFormValid && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  Completa todos los campos obligatorios correctamente para habilitar el registro.
                </p>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ── Tabla de Personal con Filas Alternadas y Badges Elegantes ── */}
      <section aria-labelledby="tabla-personal-heading">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 id="tabla-personal-heading" className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              Personal Registrado ({filteredUsuarios.length} de {usuarios.length})
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
                placeholder="Buscar por nombre, email o rol..."
                aria-label="Buscar personal"
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[36px]"
              />
            </div>
          </div>

          {deleteSuccess && (
            <div role="status" className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                <span>{deleteSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteSuccess('')}
                className="text-emerald-700 font-bold hover:text-emerald-900 cursor-pointer text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-0.5"
                aria-label="Cerrar notificación de éxito"
              >
                ✕
              </button>
            </div>
          )}

          {deleteError && (
            <div role="alert" className="mx-6 mt-4 p-3 bg-red-50 border border-red-300 text-red-700 text-xs rounded-lg flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm">⚠</span>
                <span>{deleteError}</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteError('')}
                className="text-red-700 font-bold hover:text-red-900 cursor-pointer text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded p-0.5"
                aria-label="Cerrar notificación de error"
              >
                ✕
              </button>
            </div>
          )}

          {/* ── Vista móvil en tarjetas (< md) ── */}
          <div className="md:hidden p-4">
            {loadingUsers ? (
              <div className="space-y-3" role="status" aria-label="Cargando personal">
                <div className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-20 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            ) : pagedItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                {search ? 'No se encontraron usuarios con ese criterio.' : 'No hay usuarios registrados en el sistema.'}
              </p>
            ) : (
              <ul className="space-y-3" aria-label="Listado móvil de personal">
                {pagedItems.map((u) => {
                  const isSelf = currentUser
                    ? currentUser.id === u.id || currentUser.email.toLowerCase() === u.email.toLowerCase()
                    : false

                  return (
                    <li
                      key={u.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {u.nombreCompleto.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900 text-sm truncate">{u.nombreCompleto}</span>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
                            u.rol === 'Administrador'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : u.rol === 'Veterinario'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {u.rol}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-gray-500 font-mono truncate mr-2">{u.email}</span>
                        {isSelf ? (
                          <span className="inline-flex items-center gap-1 text-purple-700 font-semibold px-2 py-0.5 bg-purple-50 rounded border border-purple-200">
                            <ShieldCheck size={13} aria-hidden="true" />
                            <span>Tu cuenta</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              deleteTriggerRef.current = e.currentTarget
                              setDeleteError('')
                              setDeleteSuccess('')
                              setToDelete(u)
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors min-h-[32px] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
                            aria-label={`Eliminar cuenta de ${u.nombreCompleto}`}
                          >
                            <Trash2 size={13} aria-hidden="true" />
                            <span>Eliminar</span>
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* ── Vista de tabla para escritorio (≥ md) ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-slate-50/90 text-gray-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Nombre y Apellidos</th>
                  <th scope="col" className="px-6 py-3.5">Correo Electrónico</th>
                  <th scope="col" className="px-6 py-3.5">Rol en el Centro</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingUsers ? (
                  <SkeletonRow cols={4} />
                ) : pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                      {search ? 'No se encontraron usuarios con ese criterio.' : 'No hay usuarios registrados en el sistema.'}
                    </td>
                  </tr>
                ) : (
                  pagedItems.map((u) => {
                    const isSelf = currentUser
                      ? currentUser.id === u.id || currentUser.email.toLowerCase() === u.email.toLowerCase()
                      : false

                    return (
                      <tr
                        key={u.id}
                        className="odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-medium text-gray-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {u.nombreCompleto.charAt(0).toUpperCase()}
                            </div>
                            <span>{u.nombreCompleto}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-gray-600 font-mono text-xs">{u.email}</td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                              u.rol === 'Administrador'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : u.rol === 'Veterinario'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {u.rol}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {isSelf ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg">
                              <ShieldCheck size={14} aria-hidden="true" />
                              <span>Tu cuenta</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                deleteTriggerRef.current = e.currentTarget
                                setDeleteError('')
                                setDeleteSuccess('')
                                setToDelete(u)
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors min-h-[32px] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
                              title={`Eliminar cuenta de ${u.nombreCompleto}`}
                              aria-label={`Eliminar cuenta de ${u.nombreCompleto}`}
                            >
                              <Trash2 size={14} aria-hidden="true" />
                              <span>Eliminar</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
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

      {/* ── Modal Accesible de Confirmación de Eliminación ── */}
      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Confirmar eliminación de personal"
        description={`¿Estás seguro de que deseas eliminar la cuenta de "${toDelete?.nombreCompleto}" (${toDelete?.email})? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar usuario"
        cancelLabel="Cancelar"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setToDelete(null)
          setDeleteError('')
        }}
        triggerRef={deleteTriggerRef}
      />
    </div>
  )
}

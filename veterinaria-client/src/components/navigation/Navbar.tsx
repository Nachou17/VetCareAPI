// ======================================================
// src/components/navigation/Navbar.tsx
// Barra de navegación con Menús Desplegables categorizados
// y soporte responsivo móvil con menú hamburguesa (WCAG 2.2 AA).
// ======================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { CLIENTES_KEY } from '../../hooks/useClientes'
import { PACIENTES_KEY } from '../../hooks/usePacientes'
import { clienteService } from '../../services/clienteService'
import { pacienteService } from '../../services/pacienteService'
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Calendar,
  Stethoscope,
  Package,
  Pill,
  Receipt,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'

export function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const queryClient = useQueryClient()

  // ── Precarga (Prefetch) inmediata de Clientes y Pacientes ───
  const prefetchClientes = useCallback(() => {
    void queryClient.prefetchQuery({
      queryKey: CLIENTES_KEY,
      queryFn: clienteService.getAll,
    })
  }, [queryClient])

  const prefetchPacientes = useCallback(() => {
    void queryClient.prefetchQuery({
      queryKey: PACIENTES_KEY,
      queryFn: pacienteService.getAll,
    })
    void queryClient.prefetchQuery({
      queryKey: CLIENTES_KEY,
      queryFn: clienteService.getAll,
    })
  }, [queryClient])

  // Estados de los dropdowns en escritorio
  const [openDropdown, setOpenDropdown] = useState<'clinica' | 'finanzas' | 'sistema' | null>(null)
  // Estado del menú hamburguesa en móvil
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navRef = useRef<HTMLElement>(null)

  // Cerrar dropdowns si se hace clic fuera del navbar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenDropdown(null)
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setOpenDropdown(null)
    setMobileMenuOpen(false)
  }, [location.pathname])

  const toggleDropdown = (menu: 'clinica' | 'finanzas' | 'sistema') => {
    setOpenDropdown((prev) => (prev === menu ? null : menu))
  }

  // Activos por categoría para destacar el botón padre del dropdown
  const isClinicaActive = ['/clientes', '/pacientes', '/citas', '/consultas'].some((path) =>
    location.pathname.startsWith(path),
  )
  const isFinanzasActive = ['/inventario', '/recetas', '/facturacion'].some((path) =>
    location.pathname.startsWith(path),
  )
  const isSistemaActive = location.pathname.startsWith('/administracion')

  const getRolBadge = (rol?: string) => {
    switch (rol) {
      case 'Administrador':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Veterinario':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo VetCare + Botón Menú Móvil */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-expanded={mobileMenuOpen}
            aria-label="Abrir menú de navegación móvil"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-lg font-bold text-blue-700 tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 min-h-[44px]"
            aria-label="VetCare inicio"
          >
            <span className="text-xl">🐾</span>
            <span className="bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
              VetCare
            </span>
          </Link>
        </div>

        {/* ── Navegación de Escritorio con Dropdowns Categorizados ── */}
        <nav
          ref={navRef}
          aria-label="Navegación principal de escritorio"
          className="hidden lg:flex items-center gap-1"
        >
          {/* Opción Principal: Dashboard */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`
            }
          >
            <LayoutDashboard size={16} aria-hidden="true" />
            Dashboard
          </NavLink>

          {/* Categoría 1: Gestión Clínica */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('clinica')}
              onMouseEnter={() => {
                prefetchClientes()
                prefetchPacientes()
              }}
              onFocus={() => {
                prefetchClientes()
                prefetchPacientes()
              }}
              aria-expanded={openDropdown === 'clinica'}
              aria-haspopup="true"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isClinicaActive || openDropdown === 'clinica'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <span>Gestión Clínica</span>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`transition-transform duration-200 ${
                  openDropdown === 'clinica' ? 'rotate-180 text-blue-600' : 'text-gray-400'
                }`}
              />
            </button>

            {openDropdown === 'clinica' && (
              <div
                role="menu"
                className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <NavLink
                  to="/clientes"
                  role="menuitem"
                  onMouseEnter={prefetchClientes}
                  onFocus={prefetchClientes}
                  onPointerDown={prefetchClientes}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`
                  }
                >
                  <Users size={16} className="text-blue-600" aria-hidden="true" />
                  <span>Clientes</span>
                </NavLink>

                <NavLink
                  to="/pacientes"
                  role="menuitem"
                  onMouseEnter={prefetchPacientes}
                  onFocus={prefetchPacientes}
                  onPointerDown={prefetchPacientes}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`
                  }
                >
                  <PawPrint size={16} className="text-cyan-600" aria-hidden="true" />
                  <span>Pacientes (Mascotas)</span>
                </NavLink>

                <NavLink
                  to="/citas"
                  role="menuitem"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`
                  }
                >
                  <Calendar size={16} className="text-indigo-600" aria-hidden="true" />
                  <span>Agenda de Citas</span>
                </NavLink>

                {(user?.rol === 'Administrador' || user?.rol === 'Veterinario') && (
                  <NavLink
                    to="/consultas"
                    role="menuitem"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                      }`
                    }
                  >
                    <Stethoscope size={16} className="text-emerald-600" aria-hidden="true" />
                    <span>Consultas Médicas</span>
                  </NavLink>
                )}
              </div>
            )}
          </div>

          {/* Categoría 2: Farmacia y Finanzas */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('finanzas')}
              aria-expanded={openDropdown === 'finanzas'}
              aria-haspopup="true"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isFinanzasActive || openDropdown === 'finanzas'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <span>Farmacia y Finanzas</span>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`transition-transform duration-200 ${
                  openDropdown === 'finanzas' ? 'rotate-180 text-blue-600' : 'text-gray-400'
                }`}
              />
            </button>

            {openDropdown === 'finanzas' && (
              <div
                role="menu"
                className="absolute left-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <NavLink
                  to="/inventario"
                  role="menuitem"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`
                  }
                >
                  <Package size={16} className="text-amber-600" aria-hidden="true" />
                  <span>Inventario / Farmacia</span>
                </NavLink>

                <NavLink
                  to="/recetas"
                  role="menuitem"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`
                  }
                >
                  <Pill size={16} className="text-indigo-600" aria-hidden="true" />
                  <span>Recetas Médicas</span>
                </NavLink>

                <NavLink
                  to="/facturacion"
                  role="menuitem"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`
                  }
                >
                  <Receipt size={16} className="text-emerald-600" aria-hidden="true" />
                  <span>Facturación y Cobros</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Categoría 3: Sistema (Solo Administrador) */}
          {user?.rol === 'Administrador' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('sistema')}
                aria-expanded={openDropdown === 'sistema'}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSistemaActive || openDropdown === 'sistema'
                    ? 'bg-purple-50 text-purple-700 font-semibold'
                    : 'text-gray-600 hover:text-purple-700 hover:bg-gray-50'
                }`}
              >
                <ShieldCheck size={16} aria-hidden="true" className="text-purple-600" />
                <span>Sistema</span>
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={`transition-transform duration-200 ${
                    openDropdown === 'sistema' ? 'rotate-180 text-purple-600' : 'text-gray-400'
                  }`}
                />
              </button>

              {openDropdown === 'sistema' && (
                <div
                  role="menu"
                  className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <NavLink
                    to="/administracion"
                    role="menuitem"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-purple-50 text-purple-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-purple-700'
                      }`
                    }
                  >
                    <ShieldCheck size={16} className="text-purple-600" aria-hidden="true" />
                    <div>
                      <p className="font-medium">Administración</p>
                      <p className="text-xs text-gray-400 font-normal">Personal y Especialidades</p>
                    </div>
                  </NavLink>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* ── Área de Usuario (Extremo Derecho) ── */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{user?.nombreCompleto}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getRolBadge(
                user?.rol,
              )}`}
            >
              {user?.rol}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[40px]"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* ── Menú Móvil Desplegable (Hamburguesa) ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {/* Usuario Móvil */}
          <div className="sm:hidden flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-800">{user?.nombreCompleto}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getRolBadge(user?.rol)}`}>
              {user?.rol}
            </span>
          </div>

          <div className="space-y-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
          </div>

          {/* Categoría Clínica */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
              Gestión Clínica
            </p>
            <NavLink
              to="/clientes"
              onMouseEnter={prefetchClientes}
              onFocus={prefetchClientes}
              onPointerDown={prefetchClientes}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Users size={18} className="text-blue-600" />
              Clientes
            </NavLink>
            <NavLink
              to="/pacientes"
              onMouseEnter={prefetchPacientes}
              onFocus={prefetchPacientes}
              onPointerDown={prefetchPacientes}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <PawPrint size={18} className="text-cyan-600" />
              Pacientes
            </NavLink>
            <NavLink
              to="/citas"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Calendar size={18} className="text-indigo-600" />
              Agenda de Citas
            </NavLink>
            {(user?.rol === 'Administrador' || user?.rol === 'Veterinario') && (
              <NavLink
                to="/consultas"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <Stethoscope size={18} className="text-emerald-600" />
                Consultas Médicas
              </NavLink>
            )}
          </div>

          {/* Categoría Finanzas */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
              Farmacia y Finanzas
            </p>
            <NavLink
              to="/inventario"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Package size={18} className="text-amber-600" />
              Inventario y Farmacia
            </NavLink>
            <NavLink
              to="/recetas"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Pill size={18} className="text-indigo-600" />
              Recetas Médicas
            </NavLink>
            <NavLink
              to="/facturacion"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Receipt size={18} className="text-emerald-600" />
              Facturación y Cobros
            </NavLink>
          </div>

          {/* Categoría Sistema */}
          {user?.rol === 'Administrador' && (
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <p className="px-3 text-xs font-bold text-purple-600 uppercase tracking-wider">
                Sistema
              </p>
              <NavLink
                to="/administracion"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <ShieldCheck size={18} className="text-purple-600" />
                Administración General
              </NavLink>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

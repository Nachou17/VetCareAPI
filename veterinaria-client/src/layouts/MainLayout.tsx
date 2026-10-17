// ======================================================
// src/layouts/MainLayout.tsx
// Layout principal: barra de navegación + contenido.
// Accesibilidad WCAG 2.2 AA:
//   - landmark <header> y <main> con role implícito
//   - nav con aria-label descriptivo
//   - skip-link para omitir navegación con teclado
// ======================================================

import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, Users, PawPrint, LayoutDashboard } from 'lucide-react'

export function MainLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip link — accesibilidad: permite saltar al contenido con teclado */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-700 focus:ring-2 focus:ring-blue-500 focus:rounded"
      >
        Saltar al contenido principal
      </a>

      {/* Header / Navbar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / marca */}
          <span className="text-lg font-bold text-blue-700 tracking-tight" aria-label="VeterinariaAPI">
            🐾 VetCare
          </span>

          {/* Navegación principal */}
          <nav aria-label="Navegación principal" className="flex gap-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`
              }
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              Dashboard
            </NavLink>
            <NavLink
              to="/clientes"
              className={({ isActive }) =>
                `flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`
              }
            >
              <Users size={16} aria-hidden="true" />
              Clientes
            </NavLink>
            <NavLink
              to="/pacientes"
              className={({ isActive }) =>
                `flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`
              }
            >
              <PawPrint size={16} aria-hidden="true" />
              Pacientes
            </NavLink>
          </nav>

          {/* Usuario + logout */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              {user?.nombreCompleto} <span className="text-xs text-blue-500">({user?.rol})</span>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors focus-visible:outline-2 focus-visible:outline-red-500"
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-xs text-gray-400 border-t border-gray-100">
        VetCare &copy; {new Date().getFullYear()} — Sistema de Gestión Veterinaria
      </footer>
    </div>
  )
}

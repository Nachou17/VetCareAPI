// ======================================================
// src/layouts/MainLayout.tsx
// Layout principal: barra de navegación + contenido.
// Accesibilidad WCAG 2.2 AA:
//   - landmark <header> y <main> con role implícito
//   - skip-link para omitir navegación con teclado
// ======================================================

import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/navigation/Navbar'
import { Toast, type ToastMessage } from '../components/ui/Toast'
import { toastEvent } from '../utils/toast'

export function MainLayout() {
  const [toast, setToast] = useState<ToastMessage | null>(null)

  useEffect(() => {
    const unsubscribe = toastEvent.subscribe((newToast) => {
      setToast(newToast)
    })
    return unsubscribe
  }, [])
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip link — accesibilidad: permite saltar al contenido con teclado */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-700 focus:ring-2 focus:ring-blue-500 focus:rounded shadow-md"
      >
        Saltar al contenido principal
      </a>

      {/* Header / Navbar con Dropdowns categorizados */}
      <Navbar />

      {/* Contenido principal */}
      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100 bg-white">
        VetCare &copy; {new Date().getFullYear()} — Plataforma de Gestión Clínica Veterinaria Integral
      </footer>

      {/* Notificación Toast accesible global (409 Conflict, avisos del sistema) */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}

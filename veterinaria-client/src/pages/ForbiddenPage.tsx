// src/pages/ForbiddenPage.tsx
import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'

export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <ShieldX size={64} className="mx-auto mb-4 text-red-400" aria-hidden="true" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">
          No tienes permisos para ver esta página.
        </p>
        <Link
          to="/dashboard"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-2 focus-visible:outline-blue-800"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

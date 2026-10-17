// src/pages/DashboardPage.tsx
import { useAuth } from '../context/AuthContext'

export function DashboardPage() {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Bienvenido, {user?.nombreCompleto}
      </h1>
      <p className="text-gray-600">
        Rol: <span className="font-medium text-blue-600">{user?.rol}</span>
      </p>
      <p className="mt-4 text-sm text-gray-500">
        Selecciona una sección del menú para comenzar a gestionar los registros.
      </p>
    </div>
  )
}

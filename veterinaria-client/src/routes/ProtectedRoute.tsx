// ======================================================
// src/routes/ProtectedRoute.tsx
// Guard de rutas privadas. Redirige a /login si el usuario
// no está autenticado; redirige a /forbidden si no tiene el
// rol requerido. Cumple requisito de autorización por roles.
// ======================================================

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // Guarda la ruta original para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}

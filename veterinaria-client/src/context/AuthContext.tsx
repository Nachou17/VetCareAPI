// ======================================================
// src/context/AuthContext.tsx
// Contexto de autenticación: almacena el usuario actual,
// expone login/logout y decodifica el JWT (sin librería extra).
// ======================================================

import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { authService } from '../services/authService'
import { tokenStorage } from '../utils/token'
import type { LoginRequest, UsuarioAuth } from '../types'

// ── Decodifica el payload del JWT sin verificar la firma ─────
function decodeJwtPayload(token: string): UsuarioAuth | null {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json) as Record<string, unknown>
    return {
      id: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as number,
      nombreCompleto: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string,
      email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] as string,
      rol: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string,
    }
  } catch {
    return null
  }
}

// ── Inicializa el usuario desde un token existente ───────────
function initUserFromToken(): UsuarioAuth | null {
  const token = tokenStorage.get()
  if (!token) return null
  return decodeJwtPayload(token)
}

// ── Tipos del contexto ───────────────────────────────────────
interface AuthContextType {
  user: UsuarioAuth | null
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioAuth | null>(initUserFromToken)

  const login = useCallback(async (credentials: LoginRequest) => {
    const token = await authService.login(credentials)
    const decoded = decodeJwtPayload(token)
    setUser(decoded)
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook de consumo ──────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

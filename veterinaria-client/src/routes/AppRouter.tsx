// ======================================================
// src/routes/AppRouter.tsx
// Enrutador principal con rutas protegidas por rol.
// Estructura:
//   /login          — pública
//   /               — redirige a /dashboard
//   /dashboard      — privada (todos los roles)
//   /clientes       — privada (Admin | Vet | Recepcionista)
//   /clientes/:id   — privada (Admin | Vet | Recepcionista)
//   /pacientes      — privada (Admin | Vet | Recepcionista)
//   /pacientes/:id  — privada (Admin | Vet | Recepcionista)
//   /forbidden      — pública (acceso denegado)
// ======================================================

import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { MainLayout } from '../layouts/MainLayout'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ClientesPage } from '../pages/ClientesPage'
import { ClienteDetailPage } from '../pages/ClienteDetailPage'
import { PacientesPage } from '../pages/PacientesPage'
import { PacienteDetailPage } from '../pages/PacienteDetailPage'
import { CitasPage } from '../pages/CitasPage'
import { ConsultasPage } from '../pages/ConsultasPage'
import { InventarioPage } from '../pages/InventarioPage'
import { RecetasPage } from '../pages/RecetasPage'
import { FacturacionPage } from '../pages/FacturacionPage'
import { AdministracionPage } from '../pages/AdministracionPage'
import { ForbiddenPage } from '../pages/ForbiddenPage'

const ADMIN_VET_RECEP = ['Administrador', 'Veterinario', 'Recepcionista']
const ADMIN_VET = ['Administrador', 'Veterinario']
const ONLY_ADMIN = ['Administrador']

export function AppRouter() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Redirige raíz */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Rutas privadas envueltas en layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Clientes — Admin | Vet | Recepcionista */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN_VET_RECEP} />}>
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/clientes/:id" element={<ClienteDetailPage />} />
          </Route>

          {/* Pacientes — Admin | Vet | Recepcionista */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN_VET_RECEP} />}>
            <Route path="/pacientes" element={<PacientesPage />} />
            <Route path="/pacientes/:id" element={<PacienteDetailPage />} />
          </Route>

          {/* Citas y Agenda — Admin | Vet | Recepcionista */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN_VET_RECEP} />}>
            <Route path="/citas" element={<CitasPage />} />
          </Route>

          {/* Consultas Médicas — Admin | Vet */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN_VET} />}>
            <Route path="/consultas" element={<ConsultasPage />} />
          </Route>

          {/* Inventario y Farmacia — Admin | Vet | Recepcionista */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN_VET_RECEP} />}>
            <Route path="/inventario" element={<InventarioPage />} />
          </Route>

          {/* Recetas Médicas — Admin | Vet | Recepcionista */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN_VET_RECEP} />}>
            <Route path="/recetas" element={<RecetasPage />} />
          </Route>

          {/* Facturación y Cobros — Admin | Vet | Recepcionista */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN_VET_RECEP} />}>
            <Route path="/facturacion" element={<FacturacionPage />} />
          </Route>

          {/* Administración y Maestros — Solo Administrador */}
          <Route element={<ProtectedRoute allowedRoles={ONLY_ADMIN} />}>
            <Route path="/administracion" element={<AdministracionPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

// ======================================================
// src/test/PaginationAndDates.test.tsx
// Pruebas unitarias de:
//   1. Funciones auxiliares de fecha y cálculo local sin desfase horario
//   2. Validación Zod de fechas en Citas, Recetas y Facturas
//   3. Funcionalidad del componente accesible Pagination y utilidad paginateList
// ======================================================

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  getLocalDateString,
  getOffsetLocalDateString,
  isPastDate,
  isPastDateTime,
} from '../utils/date'
import { paginateList, normalizePaged } from '../utils/pagination'
import { Pagination } from '../components/ui/Pagination'
import { citaSchema } from '../schemas/citaSchema'
import { recetaSchema } from '../schemas/recetaSchema'
import { facturaSchema } from '../schemas/facturaSchema'

describe('Utilidades de Fecha y Zona Horaria Local', () => {
  it('genera formato YYYY-MM-DD correspondiente a la fecha local', () => {
    const todayStr = getLocalDateString()
    expect(todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    const now = new Date()
    const expectedYear = now.getFullYear().toString()
    expect(todayStr.startsWith(expectedYear)).toBe(true)
  })

  it('detecta correctamente fechas pasadas vs presentes o futuras', () => {
    expect(isPastDate('2000-01-01')).toBe(true)
    expect(isPastDate('1990-12-31')).toBe(true)

    // La fecha de hoy no es pasada
    const today = getLocalDateString()
    expect(isPastDate(today)).toBe(false)

    // Mañana no es pasada
    const tomorrow = getOffsetLocalDateString(1)
    expect(isPastDate(tomorrow)).toBe(false)
  })

  it('detecta correctamente fechas/horas pasadas para agendamiento', () => {
    expect(isPastDateTime('2020-01-01T10:00')).toBe(true)

    // Fecha 1 día en el futuro no es pasada
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    expect(isPastDateTime(future)).toBe(false)
  })
})

describe('Validación de Fechas en Esquemas Zod', () => {
  it('citaSchema rechaza fecha y hora en el pasado', () => {
    const result = citaSchema.safeParse({
      pacienteId: 1,
      usuarioId: 2,
      especialidadId: 3,
      fechaHora: '2020-01-01T10:00',
      estado: 'Pendiente',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const errorMsg = result.error.errors.find((e) => e.path.includes('fechaHora'))?.message
      expect(errorMsg).toMatch(/no pueden? ser anteriores? al momento actual/i)
    }
  })

  it('citaSchema acepta fecha y hora futura válida', () => {
    const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const futureStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}T10:00`

    const result = citaSchema.safeParse({
      pacienteId: 1,
      usuarioId: 2,
      especialidadId: 3,
      fechaHora: futureStr,
      estado: 'Pendiente',
    })

    expect(result.success).toBe(true)
  })

  it('recetaSchema rechaza fecha de emisión pasada o vigencia menor a emisión', () => {
    const pastEmission = recetaSchema.safeParse({
      consultaId: 1,
      fechaEmision: '2020-01-01',
      validaHasta: '2020-01-15',
      insumoId: 1,
      dosis: '1 comprimido cada 12 horas',
      duracionDias: 7,
    })
    expect(pastEmission.success).toBe(false)

    const today = getLocalDateString()
    const invalidValidity = recetaSchema.safeParse({
      consultaId: 1,
      fechaEmision: today,
      validaHasta: '2020-01-01',
      insumoId: 1,
      dosis: '1 comprimido cada 12 horas',
      duracionDias: 7,
    })
    expect(invalidValidity.success).toBe(false)
  })

  it('recetaSchema acepta fechas coherentes de hoy en adelante', () => {
    const today = getLocalDateString()
    const nextWeek = getOffsetLocalDateString(7)

    const valid = recetaSchema.safeParse({
      consultaId: 1,
      fechaEmision: today,
      validaHasta: nextWeek,
      insumoId: 1,
      dosis: '1 ampolla subcutánea',
      duracionDias: 7,
    })
    expect(valid.success).toBe(true)
  })

  it('facturaSchema rechaza fecha de emisión anterior a hoy', () => {
    const result = facturaSchema.safeParse({
      clienteId: 1,
      fechaEmision: '2021-05-10',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0]?.message).toMatch(/no puede ser anterior a la fecha actual/i)
    }
  })
})

describe('Paginación y Utilidades', () => {
  it('paginateList fragmenta correctamente colecciones según pageSize y página solicitada', () => {
    const sampleItems = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }))

    const page1 = paginateList(sampleItems, 1, 10)
    expect(page1.pagedItems).toHaveLength(10)
    expect(page1.pagedItems[0].id).toBe(1)
    expect(page1.totalPages).toBe(3)
    expect(page1.totalItems).toBe(25)
    expect(page1.currentPage).toBe(1)

    const page3 = paginateList(sampleItems, 3, 10)
    expect(page3.pagedItems).toHaveLength(5)
    expect(page3.pagedItems[0].id).toBe(21)
    expect(page3.currentPage).toBe(3)
  })

  it('normalizePaged maneja arreglos crudos y objetos PagedResult unificadamente', () => {
    const rawArray = [{ id: 1 }, { id: 2 }]
    const normalized = normalizePaged(rawArray, 1, 10)
    expect(normalized.totalItems).toBe(2)
    expect(normalized.totalPages).toBe(1)

    const pagedObj = { items: [{ id: 3 }], page: 2, pageSize: 5, totalItems: 11, totalPages: 3 }
    const res = normalizePaged(pagedObj)
    expect(res.totalItems).toBe(11)
    expect(res.page).toBe(2)
  })

  it('Componente Pagination renderiza controles accesibles y responde a clics', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(
      <Pagination
        page={1}
        totalPages={4}
        totalItems={32}
        pageSize={8}
        onPageChange={onPageChange}
      />
    )

    // Landmark y controles
    expect(screen.getByRole('navigation', { name: /paginación de resultados/i })).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.textContent?.replace(/\s+/g, ' ').trim() === 'Página 1 de 4')).toBeInTheDocument()
    expect(screen.queryByText(/mostrando/i)).not.toBeInTheDocument()

    // Botón Anterior debe estar deshabilitado en página 1
    const prevBtn = screen.getByRole('button', { name: /página anterior/i })
    expect(prevBtn).toBeDisabled()

    // Botón Siguiente habilitado
    const nextBtn = screen.getByRole('button', { name: /página siguiente/i })
    expect(nextBtn).toBeEnabled()

    await user.click(nextBtn)
    expect(onPageChange).toHaveBeenCalledWith(2)

    // Botón directo a página 3
    const page3Btn = screen.getByRole('button', { name: /ir a la página 3/i })
    await user.click(page3Btn)
    expect(onPageChange).toHaveBeenCalledWith(3)
  })
})

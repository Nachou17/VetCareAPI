// ======================================================
// src/components/ui/Pagination.tsx
// Componente accesible de paginación (WCAG 2.2 AA):
//   - Botones anterior/siguiente con estados deshabilitados
//   - Anuncios para lectores de pantalla con aria-label y aria-current
//   - Selector rápido de páginas con truncamiento si hay muchas
//   - Adaptable a dispositivos móviles (apilamiento y accesibilidad táctil)
// ======================================================

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize?: number
  onPageChange: (newPage: number) => void
  disabled?: boolean
  className?: string
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
  disabled = false,
  className = '',
}: PaginationProps) {
  if (totalItems <= 0 || totalPages <= 1) {
    return null
  }

  // Generar lista de páginas para mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')

      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i)
      }

      if (page < totalPages - 2) pages.push('...')
      if (!pages.includes(totalPages)) pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav
      role="navigation"
      aria-label="Paginación de resultados"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 text-sm text-gray-700 ${className}`}
    >
      {/* Información de página actual y total */}
      <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
        Página <span className="font-semibold text-gray-800">{page}</span> de{' '}
        <span className="font-semibold text-gray-800">{totalPages}</span>
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
        {/* Botón Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Ir a la página anterior"
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span className="hidden xs:inline">Anterior</span>
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  aria-hidden="true"
                  className="px-2 py-2 text-gray-400 select-none text-xs"
                >
                  &hellip;
                </span>
              )
            }

            const pageNum = Number(p)
            const isCurrent = pageNum === page

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                disabled={disabled || isCurrent}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Ir a la página ${pageNum}`}
                className={`min-h-[44px] min-w-[44px] px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-semibold cursor-default shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Botón Siguiente */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Ir a la página siguiente"
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className="hidden xs:inline">Siguiente</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

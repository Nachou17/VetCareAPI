// ======================================================
// src/components/ui/SkeletonRow.tsx
// Skeleton loader para filas de tabla mientras se carga.
// ======================================================

interface SkeletonRowProps {
  cols: number
}

export function SkeletonRow({ cols }: SkeletonRowProps) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-lg border border-gray-200 p-4 space-y-2 animate-pulse"
    >
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  )
}

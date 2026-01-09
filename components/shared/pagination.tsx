"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const maxVisiblePages = 5

  let visiblePages = pages
  if (totalPages > maxVisiblePages) {
    const start = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2) - 1)
    const end = Math.min(totalPages, start + maxVisiblePages)
    visiblePages = pages.slice(start, end)
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Página anterior</span>
      </Button>

      <div className="flex gap-1">
        {visiblePages[0] > 1 && (
          <>
            <Button variant="outline" size="icon" onClick={() => onPageChange(1)}>
              1
            </Button>
            {visiblePages[0] > 2 && <span className="px-2 flex items-center text-muted-foreground">...</span>}
          </>
        )}

        {visiblePages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="px-2 flex items-center text-muted-foreground">...</span>
            )}
            <Button variant="outline" size="icon" onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </Button>
          </>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Página siguiente</span>
      </Button>
    </div>
  )
}

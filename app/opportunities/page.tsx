"use client"

import { useState, useEffect } from "react"
import { OpportunityCard, type Opportunity } from "@/components/shared/opportunity-card"
import { OpportunityFiltersComponent, type OpportunityFilters } from "@/components/shared/opportunity-filters"
import { Pagination } from "@/components/shared/pagination"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Briefcase, Search } from "lucide-react"
import Link from "next/link"

const ITEMS_PER_PAGE = 9

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<OpportunityFilters>({
    search: "",
    types: [],
    locations: [],
  })

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/opportunities")
      const data = await response.json()
      setOpportunities(data)
    } catch (error) {
      console.error("[v0] Error fetching opportunities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      !filters.search ||
      opp.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      opp.company.toLowerCase().includes(filters.search.toLowerCase()) ||
      opp.description.toLowerCase().includes(filters.search.toLowerCase())

    const matchesType = filters.types.length === 0 || filters.types.includes(opp.type)

    const matchesLocation = filters.locations.length === 0 || filters.locations.includes(opp.location)

    return matchesSearch && matchesType && matchesLocation
  })

  const totalPages = Math.ceil(filteredOpportunities.length / ITEMS_PER_PAGE)
  const paginatedOpportunities = filteredOpportunities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">TEC Empleos</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Instituto Tecnológico de Costa Rica</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Explorar Oportunidades</h1>
          <p className="text-muted-foreground">Descubre prácticas, proyectos de graduación y empleos disponibles</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <OpportunityFiltersComponent onFilterChange={setFilters} initialFilters={filters} />
          </aside>

          {/* Opportunities Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{filteredOpportunities.length} oportunidades encontradas</p>
            </div>

            {isLoading ? (
              <LoadingState message="Cargando oportunidades..." />
            ) : filteredOpportunities.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No se encontraron oportunidades"
                description="Intenta ajustar tus filtros de búsqueda o vuelve más tarde para ver nuevas oportunidades."
              />
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                  {paginatedOpportunities.map((opportunity) => (
                    <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

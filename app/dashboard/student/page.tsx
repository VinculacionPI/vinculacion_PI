"use client"

import { useState, useEffect } from "react"
import { OpportunityCard, type Opportunity } from "@/components/shared/opportunity-card"
import { OpportunityFiltersComponent, type OpportunityFilters } from "@/components/shared/opportunity-filters"
import { Pagination } from "@/components/shared/pagination"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { StatsCard } from "@/components/shared/stats-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Bookmark, Search, TrendingUp } from "lucide-react"

const ITEMS_PER_PAGE = 6

export default function StudentDashboardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<OpportunityFilters>({
    search: "",
    types: [],
    locations: [],
  })
  const [activeTab, setActiveTab] = useState("all")

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

  const handleFavoriteToggle = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(id)) {
        newFavorites.delete(id)
      } else {
        newFavorites.add(id)
      }
      return newFavorites
    })
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

  const displayedOpportunities =
    activeTab === "favorites" ? filteredOpportunities.filter((opp) => favorites.has(opp.id)) : filteredOpportunities

  const totalPages = Math.ceil(displayedOpportunities.length / ITEMS_PER_PAGE)
  const paginatedOpportunities = displayedOpportunities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const stats = {
    total: opportunities.length,
    internships: opportunities.filter((o) => o.type === "internship").length,
    projects: opportunities.filter((o) => o.type === "graduation-project").length,
    jobs: opportunities.filter((o) => o.type === "job").length,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Oportunidades Disponibles</h1>
        <p className="text-muted-foreground">Explora y encuentra tu próxima oportunidad profesional</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard title="Total Oportunidades" value={stats.total} icon={Briefcase} />
        <StatsCard title="Prácticas" value={stats.internships} icon={TrendingUp} />
        <StatsCard title="Proyectos" value={stats.projects} icon={Search} />
        <StatsCard title="Empleos" value={stats.jobs} icon={Briefcase} />
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <OpportunityFiltersComponent onFilterChange={setFilters} initialFilters={filters} />
        </aside>

        {/* Opportunities List */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">
                <Briefcase className="h-4 w-4 mr-2" />
                Todas ({filteredOpportunities.length})
              </TabsTrigger>
              <TabsTrigger value="favorites">
                <Bookmark className="h-4 w-4 mr-2" />
                Favoritos ({favorites.size})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <LoadingState message="Cargando oportunidades..." />
          ) : displayedOpportunities.length === 0 ? (
            <EmptyState
              icon={activeTab === "favorites" ? Bookmark : Search}
              title={
                activeTab === "favorites"
                  ? "No tienes favoritos"
                  : filters.search || filters.types.length > 0 || filters.locations.length > 0
                    ? "No se encontraron resultados"
                    : "No hay oportunidades disponibles"
              }
              description={
                activeTab === "favorites"
                  ? "Guarda oportunidades que te interesen para acceder a ellas rápidamente."
                  : "Intenta ajustar tus filtros de búsqueda o vuelve más tarde."
              }
              actionLabel={activeTab === "favorites" ? "Ver todas las oportunidades" : undefined}
              onAction={activeTab === "favorites" ? () => setActiveTab("all") : undefined}
            />
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                {paginatedOpportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onFavorite={handleFavoriteToggle}
                    isFavorite={favorites.has(opportunity.id)}
                  />
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
  )
}

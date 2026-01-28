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
import { explorarOportunidades } from "@/lib/services/api"

const ITEMS_PER_PAGE = 9

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [filters, setFilters] = useState<OpportunityFilters>({
    search: "",
    types: [],
    locations: [],
  })

  useEffect(() => {
    fetchOpportunities()
  }, [currentPage, filters])

  const fetchOpportunities = async () => {
    setIsLoading(true)
    try {
      // Mapear tipos del frontend al backend
      const tiposMapeados = filters.types.map((t: string) => {
        if (t === 'internship') return 'PASANTIA'
        if (t === 'graduation-project') return 'TFG'
        if (t === 'job') return 'EMPLEO'
        return t
      })

      // Llamar a tu backend real
      const response = await explorarOportunidades({
        busqueda: filters.search,
        tipo: tiposMapeados,
        pagina: currentPage,
        limite: ITEMS_PER_PAGE,
      })

      if (response.success) {
        // Transformar datos del backend al formato del frontend
        const transformedData = response.data.map((opp: any) => ({
          id: opp.id,
          title: opp.title,
          description: opp.description,
          company: opp.COMPANY?.name || 'Empresa',
          companyId: opp.company_id,
          location: 'San José', // Mock - agregar a BD si necesario
          type: opp.type === 'TFG' ? 'graduation-project' : 
                opp.type === 'PASANTIA' ? 'internship' : 'job',
          status: opp.status === 'OPEN' ? 'active' : 'inactive',
          postedAt: new Date(opp.created_at).toLocaleDateString('es-CR'),
        }))

        setOpportunities(transformedData)
        setTotalPages(response.paginacion.total_paginas || 1)
        setTotalResults(response.paginacion.total_resultados)
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error)
      
      // FALLBACK: Si falla, usar API original de los compañeros
      try {
        const response = await fetch("/api/opportunities")
        const data = await response.json()
        setOpportunities(data)
      } catch (fallbackError) {
        console.error("[v0] Fallback también falló:", fallbackError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Vinculación Empresarial EIPI</h1>
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
              <p className="text-sm text-muted-foreground">
                {totalResults > 0 ? `${totalResults} oportunidades encontradas` : `${opportunities.length} oportunidades encontradas`}
              </p>
            </div>

            {isLoading ? (
              <LoadingState message="Cargando oportunidades..." />
            ) : opportunities.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No se encontraron oportunidades"
                description="Intenta ajustar tus filtros de búsqueda o vuelve más tarde para ver nuevas oportunidades."
              />
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                  {opportunities.map((opportunity) => (
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
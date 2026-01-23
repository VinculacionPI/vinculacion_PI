"use client"

import { useEffect, useMemo, useState } from "react"

import { OpportunityCard, type Opportunity } from "@/components/shared/opportunity-card"
import { Pagination } from "@/components/shared/pagination"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { StatsCard } from "@/components/shared/stats-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Bookmark, Search, TrendingUp } from "lucide-react"

const ITEMS_PER_PAGE = 12

type OpportunitiesApiResponse = {
  data: Opportunity[]
  page: number
  total: number
  totalPages: number
}

type CompanyOption = { id: string; name: string }

type TfgFilters = {
  q: string
  mode: string
  duration: string
  companyId: string
}

export default function StudentDashboardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [companies, setCompanies] = useState<CompanyOption[]>([])

  const [filters, setFilters] = useState<TfgFilters>({
    q: "",
    mode: "",
    duration: "",
    companyId: "",
  })

  const [activeTab, setActiveTab] = useState<"all" | "interested">("all")

  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set())
  const [interestedTotal, setInterestedTotal] = useState(0)

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies", { cache: "no-store" })
      const json = await res.json()
      if (res.ok) setCompanies(json.data ?? [])
    } catch (e) {
      console.error("Error fetching companies:", e)
    }
  }

  const fetchInterestsBatch = async (opps: Opportunity[]) => {
    try {
      if (!opps.length) {
        setInterestedIds(new Set())
        return
      }

      const resInterest = await fetch("/api/interest/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ opportunityIds: opps.map((o) => o.id) }),
      })

      if (!resInterest.ok) {
        setInterestedIds(new Set())
        return
      }

      const j = await resInterest.json()
      setInterestedIds(new Set((j.interestedIds ?? []) as string[]))
    } catch (e) {
      console.error("Error fetching interests batch:", e)
      setInterestedIds(new Set())
    }
  }

  const fetchOpportunitiesAll = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(currentPage))
      params.set("pageSize", String(ITEMS_PER_PAGE))

      if (filters.q.trim()) params.set("q", filters.q.trim())
      if (filters.mode) params.set("mode", filters.mode)
      if (filters.duration) params.set("duration", filters.duration)
      if (filters.companyId) params.set("companyId", filters.companyId)

      const res = await fetch(`/api/opportunities?${params.toString()}`, { cache: "no-store" })
      const json = (await res.json()) as OpportunitiesApiResponse

      if (!res.ok) {
        console.error("API /api/opportunities error:", json)
        setOpportunities([])
        setInterestedIds(new Set())
        setTotalPages(1)
        return
      }

      const opps = json.data ?? []
      setOpportunities(opps)
      setTotalPages(json.totalPages ?? 1)

      await fetchInterestsBatch(opps)

      // el total de interesados no aplica en tab "all"
      setInterestedTotal(0)
    } catch (err) {
      console.error("Error fetching opportunities:", err)
      setOpportunities([])
      setInterestedIds(new Set())
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOpportunitiesInterested = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(currentPage))
      params.set("pageSize", String(ITEMS_PER_PAGE))

      // Para CU-015: filtrado en lista personal
      if (filters.q.trim()) params.set("q", filters.q.trim())

      // Si querés filtrar estado desde UI, aquí podrías setearlo:
      // params.set("status", "ACTIVE")

      const res = await fetch(`/api/my-interests?${params.toString()}`, { cache: "no-store" })
      const json = (await res.json()) as OpportunitiesApiResponse

      if (!res.ok) {
        console.error("API /api/my-interests error:", json)
        setOpportunities([])
        setInterestedIds(new Set())
        setTotalPages(1)
        setInterestedTotal(0)
        return
      }

      const opps = json.data ?? []
      setOpportunities(opps)
      setTotalPages(json.totalPages ?? 1)
      setInterestedTotal(json.total ?? opps.length)

      // Como esta lista es solo interesadas, todos los ids vienen marcados
      setInterestedIds(new Set(opps.map((o) => o.id)))
    } catch (err) {
      console.error("Error fetching my interests:", err)
      setOpportunities([])
      setInterestedIds(new Set())
      setTotalPages(1)
      setInterestedTotal(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  // Cuando cambian page/filtros/tab, decide qué cargar
  useEffect(() => {
    if (activeTab === "interested") fetchOpportunitiesInterested()
    else fetchOpportunitiesAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, filters.q, filters.mode, filters.duration, filters.companyId])

  // Si cambian filtros, volver a página 1
  useEffect(() => {
    setCurrentPage(1)
  }, [filters.q, filters.mode, filters.duration, filters.companyId, activeTab])

  const handleInterestToggle = async (id: string, next: boolean) => {
    try {
      const res = await fetch("/api/interest", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: id }),
        cache: "no-store",
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        if (res.status === 401) alert("Debes iniciar sesión.")
        else if ((j as any)?.error === "DUPLICATE") alert("Ya manifestaste interés.")
        else if ((j as any)?.error === "INACTIVE") alert("Publicación no activa.")
        else alert("No se pudo procesar la acción.")
        return
      }

      setInterestedIds((prev) => {
        const copy = new Set(prev)
        next ? copy.add(id) : copy.delete(id)
        return copy
      })

      // Si estás en "Interesadas" y retirás interés, refrescá la lista desde backend
      if (activeTab === "interested" && !next) {
        await fetchOpportunitiesInterested()
        return
      }

      // Si estás en "Todas" solo actualizá local, pero opcionalmente refrescá batch
      // await fetchInterestsBatch(opportunities)

    } catch (e) {
      console.error("Error toggling interest:", e)
      alert("Error de red.")
    }
  }

  const stats = useMemo(() => {
    return {
      total: opportunities.length,
      internships: 0,
      projects: opportunities.length,
      jobs: 0,
    }
  }, [opportunities])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Oportunidades TFG Disponibles</h1>
        <p className="text-muted-foreground">Explora, filtra y consulta oportunidades de TFG</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard title="Total" value={stats.total} icon={Briefcase} />
        <StatsCard title="Prácticas" value={stats.internships} icon={TrendingUp} />
        <StatsCard title="TFG" value={stats.projects} icon={Search} />
        <StatsCard title="Empleos" value={stats.jobs} icon={Briefcase} />
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Buscar</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Título, descripción..."
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Modalidad</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={filters.mode}
                onChange={(e) => setFilters((p) => ({ ...p, mode: e.target.value }))}
                disabled={activeTab === "interested"}
                title={activeTab === "interested" ? "Este filtro no está aplicado en la lista de intereses (por ahora)" : ""}
              >
                <option value="">Todas</option>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="híbrida">Híbrida</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Duración</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Ej: 3 meses / 6 meses"
                value={filters.duration}
                onChange={(e) => setFilters((p) => ({ ...p, duration: e.target.value }))}
                disabled={activeTab === "interested"}
                title={activeTab === "interested" ? "Este filtro no está aplicado en la lista de intereses (por ahora)" : ""}
              />
              <p className="mt-1 text-xs text-muted-foreground">Debe coincidir con duration_estimated (por ahora).</p>
            </div>

            <div>
              <label className="text-sm font-medium">Empresa</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={filters.companyId}
                onChange={(e) => setFilters((p) => ({ ...p, companyId: e.target.value }))}
                disabled={activeTab === "interested"}
                title={activeTab === "interested" ? "Este filtro no está aplicado en la lista de intereses (por ahora)" : ""}
              >
                <option value="">Todas</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="w-full rounded-md border px-3 py-2 text-sm"
              onClick={() => setFilters({ q: "", mode: "", duration: "", companyId: "" })}
              type="button"
            >
              Limpiar filtros
            </button>
          </div>
        </aside>

        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">
                <Briefcase className="h-4 w-4 mr-2" />
                Todas
              </TabsTrigger>
              <TabsTrigger value="interested">
                <Bookmark className="h-4 w-4 mr-2" />
                Interesadas ({activeTab === "interested" ? interestedTotal : interestedIds.size})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <LoadingState message="Cargando oportunidades..." />
          ) : opportunities.length === 0 ? (
            <EmptyState
              icon={activeTab === "interested" ? Bookmark : Search}
              title={activeTab === "interested" ? "No has manifestado interés" : "No se encontraron resultados"}
              description={
                activeTab === "interested"
                  ? "Marca el ícono para manifestar interés en una oportunidad."
                  : "Intenta ajustar tu búsqueda o filtros."
              }
              actionLabel={activeTab === "interested" ? "Ver todas" : undefined}
              onAction={activeTab === "interested" ? () => setActiveTab("all") : undefined}
            />
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 mb-6">
                {opportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    isInterested={interestedIds.has(opportunity.id)}
                    onInterestToggle={handleInterestToggle}
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

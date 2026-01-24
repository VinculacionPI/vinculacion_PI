"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OpportunityCard, type Opportunity } from "@/components/shared/opportunity-card"
import { Pagination } from "@/components/shared/pagination"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { StatsCard } from "@/components/shared/stats-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase/client"

import { 
  Briefcase, Bookmark, Search, TrendingUp, 
  User, Bell, GraduationCap, X
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

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
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [companies, setCompanies] = useState<CompanyOption[]>([])

  const [filters, setFilters] = useState<TfgFilters>({
    q: "",
    mode: "all",
    duration: "",
    companyId: "all",
  })

  const [activeTab, setActiveTab] = useState<"all" | "interested">("all")

  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set())
  const [interestedTotal, setInterestedTotal] = useState(0)

  // Obtener perfil del usuario
  const fetchUserProfile = async () => {
    try {
      // 1. Obtener sesión del usuario usando el cliente configurado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error("Error obteniendo sesión:", sessionError)
        throw sessionError
      }

      if (!session) {
        console.log("No hay sesión activa, redirigiendo a login")
        router.push('/login')
        return
      }

      console.log("Usuario autenticado ID:", session.user.id)

      // 2. Obtener perfil desde la tabla USERS
      const { data: profile, error: profileError } = await supabase
        .from("USERS")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (profileError) {
        console.error("Error obteniendo perfil:", profileError)
        
        // Si el perfil no existe en USERS, pero sí en auth.users
        if (profileError.code === 'PGRST116') { // Código para "no encontrado"
          console.log("Perfil no encontrado en USERS, creando uno básico...")
          
          // Crear perfil básico con datos de auth
          const basicProfile = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.full_name || 
                  session.user.user_metadata?.name || 
                  "Usuario",
            role: "student",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          // Insertar en USERS
          const { data: newProfile, error: insertError } = await supabase
            .from("USERS")
            .insert([basicProfile])
            .select()
            .single()
            
          if (insertError) {
            console.error("Error creando perfil:", insertError)
            // Usar datos mínimos de sesión
            setUserProfile({
              id: session.user.id,
              name: session.user.email?.split('@')[0] || "Estudiante",
              email: session.user.email,
              role: "student"
            })
            return
          }
          
          setUserProfile(newProfile)
          console.log("Perfil creado:", newProfile.name)
          return
        }
        
        // Usar datos mínimos de sesión en caso de error
        setUserProfile({
          id: session.user.id,
          name: session.user.email?.split('@')[0] || "Estudiante",
          email: session.user.email,
          role: "student"
        })
        return
      }

      // 4. Actualizar estado con el perfil real
      setUserProfile(profile)
      console.log("Perfil obtenido de Supabase:", profile.name)

    } catch (error) {
      console.error("Error obteniendo perfil:", error)
    }
  }

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies", {
        cache: "no-store",
        credentials: "include",
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setCompanies(json.data)
      } else {
        setCompanies([])
      }
    } catch (e) {
      console.error("Error fetching companies:", e)
      setCompanies([])
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
      if (j.interestedIds && Array.isArray(j.interestedIds)) {
        setInterestedIds(new Set(j.interestedIds))
      } else {
        setInterestedIds(new Set())
      }
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
      if (filters.duration) params.set("duration", filters.duration)
      if (filters.mode !== "all") {
        params.set("mode", filters.mode)
      }

      if (filters.companyId !== "all") {
        params.set("companyId", filters.companyId)
      }

      const res = await fetch(`/api/opportunities?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      })
      
      if (!res.ok) {
        console.error("API /api/opportunities error:", res.status)
        setOpportunities([])
        setInterestedIds(new Set())
        setTotalPages(1)
        return
      }

      const json = await res.json() as OpportunitiesApiResponse
      const opps = json.data ?? []
      setOpportunities(opps)
      setTotalPages(json.totalPages ?? 1)

      await fetchInterestsBatch(opps)
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

      if (filters.q.trim()) params.set("q", filters.q.trim())
        
      const res = await fetch(`/api/my-interests?${params.toString()}`, { 
        cache: "no-store",
        credentials: "include",
      })
      
      if (!res.ok) {
        console.error("API /api/my-interests error:", res.status)
        setOpportunities([])
        setInterestedIds(new Set())
        setTotalPages(1)
        setInterestedTotal(0)
        return
      }

      const json = await res.json() as OpportunitiesApiResponse
      const opps = json.data ?? []
      setOpportunities(opps)
      setTotalPages(json.totalPages ?? 1)
      setInterestedTotal(json.total ?? opps.length)
      
      // Todas las oportunidades en "mis intereses" deben estar marcadas como interesadas
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
    fetchUserProfile()
    fetchCompanies()
  }, [])

  // Cuando cambian page/filtros/tab, decide qué cargar
  useEffect(() => {
    if (activeTab === "interested") {
      fetchOpportunitiesInterested()
    } else {
      fetchOpportunitiesAll()
    }
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
        credentials: "include",
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        if (res.status === 401) {
          alert("Debes iniciar sesión.")
          router.push('/login')
        } else if (j.error === "DUPLICATE") {
          alert("Ya manifestaste interés en esta oportunidad.")
        } else if (j.error === "INACTIVE") {
          alert("Esta oportunidad no está activa.")
        } else {
          alert("No se pudo procesar la acción.")
        }
        return
      }

      // Actualizar estado local inmediatamente
      setInterestedIds((prev) => {
        const copy = new Set(prev)
        next ? copy.add(id) : copy.delete(id)
        return copy
      })

      // Si estamos en la pestaña "interesadas" y quitamos interés, recargar
      if (activeTab === "interested" && !next) {
        await fetchOpportunitiesInterested()
      }

    } catch (e) {
      console.error("Error toggling interest:", e)
      alert("Error de red. Por favor intenta de nuevo.")
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const stats = useMemo(() => {
    return {
      total: opportunities.length,
      internships: opportunities.filter(o => o.type?.toLowerCase().includes('practica') || o.type?.toLowerCase().includes('intern')).length,
      projects: opportunities.filter(o => o.type?.toLowerCase().includes('tfg') || o.type?.toLowerCase().includes('proyecto')).length,
      jobs: opportunities.filter(o => o.type?.toLowerCase().includes('empleo') || o.type?.toLowerCase().includes('trabajo')).length,
    }
  }, [opportunities])

  const clearFilters = () => {
    setFilters({ q: "", mode: "", duration: "", companyId: "" })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header con perfil del usuario */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Oportunidades TFG Disponibles
          </h1>
          <p className="text-muted-foreground">
            {userProfile ? `Bienvenido, ${userProfile.name}` : 'Cargando perfil...'}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              {userProfile?.name?.split(' ')[0] || 'Cuenta'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push('/dashboard/student/profile')}>
              <User className="h-4 w-4 mr-2" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/student/notifications')}>
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <X className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard 
          title="Total" 
          value={stats.total} 
          icon={Briefcase} 
          description="Oportunidades disponibles"
        />
        <StatsCard 
          title="Prácticas" 
          value={stats.internships} 
          icon={TrendingUp} 
          description="Oportunidades de práctica"
        />
        <StatsCard 
          title="TFG" 
          value={stats.projects} 
          icon={GraduationCap} 
          description="Proyectos de grado"
        />
        <StatsCard 
          title="Empleos" 
          value={stats.jobs} 
          icon={Briefcase} 
          description="Ofertas laborales"
        />
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Panel de filtros */}
        <aside className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Filtros</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar</label>
                    <Input
                      placeholder="Título, descripción, habilidades..."
                      value={filters.q}
                      onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Modalidad</label>
                    <Select
                      value={filters.mode}
                      onValueChange={(value) => setFilters((p) => ({ ...p, mode: value }))}
                      disabled={activeTab === "interested"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las modalidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="híbrida">Híbrida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duración</label>
                    <Input
                      placeholder="Ej: 3 meses, 6 meses"
                      value={filters.duration}
                      onChange={(e) => setFilters((p) => ({ ...p, duration: e.target.value }))}
                      disabled={activeTab === "interested"}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Empresa</label>
                    <Select
                      value={filters.companyId}
                      onValueChange={(value) => setFilters((p) => ({ ...p, companyId: value }))}
                      disabled={activeTab === "interested" || companies.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las empresas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={clearFilters} 
                    className="w-full"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Contenido principal */}
        <div className="lg:col-span-3">
          {/* Pestañas */}
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "interested")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Todas las oportunidades
                  <Badge variant="secondary" className="ml-2">
                    {activeTab === "all" ? opportunities.length : "..."}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="interested" className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  Mis intereses
                  <Badge variant="secondary" className="ml-2">
                    {activeTab === "interested" ? interestedTotal : interestedIds.size}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Estado de carga */}
          {isLoading ? (
            <div className="py-12">
              <LoadingState message="Cargando oportunidades..." />
            </div>
          ) : opportunities.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={activeTab === "interested" ? Bookmark : Search}
                title={
                  activeTab === "interested" 
                    ? "No has manifestado interés en ninguna oportunidad" 
                    : "No se encontraron oportunidades"
                }
                description={
                  activeTab === "interested"
                    ? "Marca el ícono de favorito en las oportunidades que te interesen"
                    : "Intenta ajustar tus filtros o busca con diferentes términos"
                }
                actionLabel={activeTab === "interested" ? "Explorar todas" : undefined}
                onAction={activeTab === "interested" ? () => setActiveTab("all") : undefined}
              />
            </div>
          ) : (
            <>
              {/* Grid de oportunidades */}
              <div className="grid gap-6 md:grid-cols-2">
                {opportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    isInterested={interestedIds.has(opportunity.id)}
                    onInterestToggle={handleInterestToggle}
                  />
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
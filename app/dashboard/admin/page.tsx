"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { StatsCard } from "@/components/shared/stats-card"
import { LoadingState } from "@/components/shared/loading-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Building2, Briefcase, Users, CheckCircle, Clock, User, X, GraduationCap, BarChart } from "lucide-react"
import { CompanyApprovalsTable } from "@/components/admin/company-approvals-table"
import { OpportunityApprovalsTable } from "@/components/admin/opportunity-approvals-table"
import { GraduatesApprovalsTable } from "@/components/admin/graduates-approvals-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type AdminStats = {
  totalCompanies: number
  pendingCompanies: number
  totalOpportunities: number
  pendingOpportunities: number
  totalUsers: number
  activeOpportunities: number

  // pendingGraduations?: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      router.push("/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  useEffect(() => {
    const fetchAdminStats = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/admin/stats", { cache: "no-store" })
        const data = await response.json().catch(() => null)

        if (!response.ok || !data) {
          console.error("Error fetching admin stats:", data)
          setStats({
            totalCompanies: 0,
            pendingCompanies: 0,
            totalOpportunities: 0,
            pendingOpportunities: 0,
            totalUsers: 0,
            activeOpportunities: 0,
          })
          return
        }

        setStats(data)
      } catch (error) {
        console.error("Error fetching admin stats:", error)
        setStats({
          totalCompanies: 0,
          pendingCompanies: 0,
          totalOpportunities: 0,
          pendingOpportunities: 0,
          totalUsers: 0,
          activeOpportunities: 0,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdminStats()
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState message="Cargando estadísticas..." />
      </div>
    )
  }

  // placeholder por ahora (lo conectamos cuando hagamos /api/admin/graduation-requests/pending)
  const pendingGraduations: number | null = null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona aprobaciones y supervisa la plataforma</p>
        </div>

        <div className="flex items-center gap-3">
          {/* BOTÓN NUEVO: Informes */}
          <Button 
            variant="default" 
            onClick={() => router.push('/informes')}
            className="gap-2"
          >
            <BarChart className="h-4 w-4" />
            Informes
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatsCard
          title="Empresas Registradas"
          value={stats.totalCompanies}
          icon={Building2}
          description={`${stats.pendingCompanies} pendientes de aprobación`}
        />
        <StatsCard
          title="Oportunidades Publicadas"
          value={stats.totalOpportunities}
          icon={Briefcase}
          description={`${stats.activeOpportunities} activas`}
        />
        <StatsCard title="Usuarios Registrados" value={stats.totalUsers} icon={Users} />
        <StatsCard
          title="Aprobaciones Pendientes"
          value={stats.pendingCompanies + stats.pendingOpportunities}
          icon={Clock}
          description="Empresas y oportunidades"
        />
        <StatsCard
          title="Empresas Aprobadas"
          value={stats.totalCompanies - stats.pendingCompanies}
          icon={CheckCircle}
        />
        <StatsCard
          title="Oportunidades Pendientes"
          value={stats.pendingOpportunities}
          icon={Clock}
          description="Requieren revisión"
        />

        {/* 👇 opcional: tarjeta de graduación (por ahora "—") */}
        <StatsCard
          title="Graduaciones Pendientes"
          value={pendingGraduations ?? "—"}
          icon={GraduationCap}
          description="Solicitudes por revisar"
        />
      </div>

      <Tabs defaultValue="companies" className="space-y-6">
        <TabsList>
          <TabsTrigger value="companies">
            <Building2 className="h-4 w-4 mr-2" />
            Empresas Pendientes ({stats.pendingCompanies})
          </TabsTrigger>

          <TabsTrigger value="opportunities">
            <Briefcase className="h-4 w-4 mr-2" />
            Oportunidades Pendientes ({stats.pendingOpportunities})
          </TabsTrigger>

          {/* NUEVO TAB */}
          <TabsTrigger value="graduates">
            <GraduationCap className="h-4 w-4 mr-2" />
            Graduados Pendientes ({pendingGraduations ?? "—"})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <CompanyApprovalsTable />
        </TabsContent>

        <TabsContent value="opportunities">
          <OpportunityApprovalsTable />
        </TabsContent>

        {/* NUEVA SECCIÓN */}
        <TabsContent value="graduates">
          <GraduatesApprovalsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

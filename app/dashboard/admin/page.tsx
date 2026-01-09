"use client"

import { useState, useEffect } from "react"
import { StatsCard } from "@/components/shared/stats-card"
import { LoadingState } from "@/components/shared/loading-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Briefcase, Users, CheckCircle, Clock } from "lucide-react"
import { CompanyApprovalsTable } from "@/components/admin/company-approvals-table"
import { OpportunityApprovalsTable } from "@/components/admin/opportunity-approvals-table"

interface AdminStats {
  totalCompanies: number
  pendingCompanies: number
  totalOpportunities: number
  pendingOpportunities: number
  totalUsers: number
  activeOpportunities: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("[v0] Error fetching admin stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState message="Cargando estadísticas..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Panel de Administración</h1>
        <p className="text-muted-foreground">Gestiona aprobaciones y supervisa la plataforma</p>
      </div>

      {/* Stats Overview */}
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
      </div>

      {/* Approval Management */}
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
        </TabsList>

        <TabsContent value="companies">
          <CompanyApprovalsTable />
        </TabsContent>

        <TabsContent value="opportunities">
          <OpportunityApprovalsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/shared/stats-card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Plus, Briefcase, Eye, Clock, CheckCircle, XCircle, Edit, MoreVertical } from "lucide-react"
import type { Opportunity } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CompanyDashboardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchCompanyOpportunities()
  }, [])

  const fetchCompanyOpportunities = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/company/opportunities")
      const data = await response.json()
      setOpportunities(data)
    } catch (error) {
      console.error("[v0] Error fetching company opportunities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    // TODO: Implement deactivation API call
    console.log("[v0] Deactivating opportunity:", id)
  }

  const handleDelete = async (id: string) => {
    // TODO: Implement delete API call
    console.log("[v0] Deleting opportunity:", id)
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    if (activeTab === "all") return true
    if (activeTab === "active") return opp.status === "active" || opp.status === "approved"
    if (activeTab === "pending") return opp.status === "pending"
    if (activeTab === "inactive") return opp.status === "inactive" || opp.status === "rejected"
    return true
  })

  const stats = {
    total: opportunities.length,
    active: opportunities.filter((o) => o.status === "active" || o.status === "approved").length,
    pending: opportunities.filter((o) => o.status === "pending").length,
    views: 1234, // Mock data
  }

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    approved: "bg-green-500/10 text-green-700 dark:text-green-400",
    active: "bg-green-500/10 text-green-700 dark:text-green-400",
    rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
    inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  }

  const statusLabels = {
    pending: "Pendiente",
    approved: "Aprobado",
    active: "Activo",
    rejected: "Rechazado",
    inactive: "Inactivo",
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis Oportunidades</h1>
          <p className="text-muted-foreground">Gestiona las oportunidades publicadas por tu empresa</p>
        </div>
        <Link href="/dashboard/company/opportunities/new">
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Oportunidad
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard title="Total Publicadas" value={stats.total} icon={Briefcase} />
        <StatsCard title="Activas" value={stats.active} icon={CheckCircle} />
        <StatsCard title="Pendientes Aprobación" value={stats.pending} icon={Clock} />
        <StatsCard title="Visualizaciones" value={stats.views} icon={Eye} description="En los últimos 30 días" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Todas ({opportunities.length})</TabsTrigger>
          <TabsTrigger value="active">Activas ({stats.active})</TabsTrigger>
          <TabsTrigger value="pending">Pendientes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="inactive">Inactivas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Opportunities List */}
      {isLoading ? (
        <LoadingState message="Cargando oportunidades..." />
      ) : filteredOpportunities.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No tienes oportunidades"
          description="Comienza a publicar oportunidades para atraer talento del TEC."
          actionLabel="Crear Primera Oportunidad"
          onAction={() => (window.location.href = "/dashboard/company/opportunities/new")}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOpportunities.map((opportunity) => (
            <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{opportunity.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{opportunity.type}</Badge>
                      <Badge variant="outline" className={statusColors[opportunity.status]}>
                        {statusLabels[opportunity.status]}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Opciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/company/opportunities/${opportunity.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/opportunities/${opportunity.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </Link>
                      </DropdownMenuItem>
                      {(opportunity.status === "active" || opportunity.status === "approved") && (
                        <DropdownMenuItem onClick={() => handleDeactivate(opportunity.id)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Desactivar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDelete(opportunity.id)} className="text-destructive">
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-3">{opportunity.description}</CardDescription>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {opportunity.postedAt}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {Math.floor(Math.random() * 200)} vistas
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Link href={`/dashboard/company/opportunities/${opportunity.id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </Link>
                <Link href={`/opportunities/${opportunity.id}`} className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

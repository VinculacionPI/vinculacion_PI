"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  TrendingUp, 
  Eye, 
  CheckCircle2,
  FileText,
  Download,
  Filter,
  X
} from "lucide-react"
import Link from "next/link"
import { obtenerDashboardEmpresa, obtenerOportunidadesEmpresa } from "@/lib/services/persona5-backend"
import { DashboardStats } from "@/components/company/dashboard-stats"
import { LoadingState } from "@/components/shared/loading-state"
import { getCompanyIdFromUrl } from '@/lib/auth/get-current-user'
import { Trash2, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"


interface Filters {
  search: string
  type: string
  status: string
  approvalStatus: string
  dateFrom: string
  dateTo: string
}

export default function CompanyDashboardPage() {
  const router = useRouter()
  
  // Obtener empresa_id del URL
  const empresaId = getCompanyIdFromUrl()

  const [opportunities, setOpportunities] = useState<any[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = useState<any[]>([])
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: 'all',
    status: 'all',
    approvalStatus: 'all',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    if (empresaId) {
      loadDashboardData()
      loadOpportunities()
    }
  }, [empresaId])

  useEffect(() => {
    applyFilters()
  }, [opportunities, filters, activeTab])

  const loadDashboardData = async () => {
    try {
      const response = await obtenerDashboardEmpresa(empresaId!, 30)
      if (response.success) {
        setDashboardData(response.data)
      }
    } catch (err) {
      console.error('Error cargando dashboard:', err)
    }
  }

  const loadOpportunities = async () => {
    setIsLoading(true)
    try {
      const data = await obtenerOportunidadesEmpresa(empresaId!)
      setOpportunities(data)
      const filtered = data.filter((opp: any) => 
        activeTab === 'all' || 
        (activeTab === 'active' && opp.status === 'OPEN') ||
        (activeTab === 'inactive' && opp.status === 'CLOSED')
      )
      setFilteredOpportunities(filtered)
    } catch (err) {
      console.error('Error cargando oportunidades:', err)
      setOpportunities([])
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...opportunities]

      // Filtro por tab activo
      if (activeTab === 'active') {
        filtered = filtered.filter(opp => opp.status === 'OPEN')
      } else if (activeTab === 'inactive') {
        filtered = filtered.filter(opp => opp.status === 'CLOSED')
      } else if (activeTab === 'pending') {
        filtered = filtered.filter(opp => opp.approval_status === 'PENDING')
      } else if (activeTab === 'approved') {
        filtered = filtered.filter(opp => opp.approval_status === 'APPROVED')
      } else if (activeTab === 'rejected') {
        filtered = filtered.filter(opp => opp.approval_status === 'REJECTED')
      }

    // Búsqueda
    if (filters.search) {
      filtered = filtered.filter(opp =>
        opp.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        opp.description?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Tipo
    if (filters.type !== 'all') {
      filtered = filtered.filter(opp => opp.type === filters.type)
    }

    // Estado
    if (filters.status !== 'all') {
      filtered = filtered.filter(opp => opp.status === filters.status)
    }

    // Estado de aprobación
    if (filters.approvalStatus !== 'all') {
      filtered = filtered.filter(opp => opp.approval_status === filters.approvalStatus)
    }

    // Fechas
    if (filters.dateFrom) {
      filtered = filtered.filter(opp => 
        new Date(opp.created_at) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(opp => 
        new Date(opp.created_at) <= new Date(filters.dateTo)
      )
    }

    setFilteredOpportunities(filtered)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      status: 'all',
      approvalStatus: 'all',
      dateFrom: '',
      dateTo: ''
    })
  }

  const hasActiveFilters = filters.search || 
    filters.type !== 'all' || 
    filters.status !== 'all' ||
    filters.approvalStatus !== 'all' ||
    filters.dateFrom ||
    filters.dateTo

  const handleExport = (format: 'CSV' | 'JSON') => {
    const dataToExport = filteredOpportunities.map(opp => ({
      id: opp.id,
      title: opp.title,
      type: opp.type,
      status: opp.status,
      approval_status: opp.approval_status,
      created_at: new Date(opp.created_at).toLocaleDateString('es-CR')
    }))

    if (format === 'CSV') {
      const headers = ['ID', 'Título', 'Tipo', 'Estado', 'Aprobación', 'Fecha']
      const csv = [
        headers.join(','),
        ...dataToExport.map(row => 
          [row.id, row.title, row.type, row.status, row.approval_status, row.created_at].join(',')
        )
      ].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `oportunidades-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } else {
      const json = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `oportunidades-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    }
  }

  const stats = {
    total: opportunities.length,
    active: opportunities.filter(o => o.status === 'OPEN').length,
    pending: opportunities.filter(o => o.approval_status === 'PENDING').length,
    views: dashboardData?.metricas_generales?.total_visualizaciones || 0
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Empresarial</h1>
          <p className="text-muted-foreground">Gestiona tus oportunidades y visualiza métricas</p>
        </div>
        <Link href={`/dashboard/company/opportunities/new?empresa_id=${empresaId}`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Oportunidad
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setActiveTab('all')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Publicadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Click para ver todas</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setActiveTab('active')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Click para filtrar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Esperando aprobación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizaciones Totales</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('CSV')}>
                <Download className="h-4 w-4 mr-1" />
                Descargar CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('JSON')}>
                <Download className="h-4 w-4 mr-1" />
                Descargar JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Búsqueda</Label>
              <Input
                placeholder="Buscar por título o descripción..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="TFG">Proyecto</SelectItem>
                  <SelectItem value="PASANTIA">Pasantía</SelectItem>
                  <SelectItem value="EMPLEO">Empleo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="OPEN">Activos</SelectItem>
                  <SelectItem value="CLOSED">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Aprobación</Label>
              <Select value={filters.approvalStatus} onValueChange={(value) => setFilters({ ...filters, approvalStatus: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="PENDING">Pendientes</SelectItem>
                  <SelectItem value="APPROVED">Aprobadas</SelectItem>
                  <SelectItem value="REJECTED">Rechazadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-4">
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </CardContent>
        
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">Todas ({opportunities.length})</TabsTrigger>
          <TabsTrigger value="active">Activas ({stats.active})</TabsTrigger>
          <TabsTrigger value="inactive">Inactivas ({opportunities.length - stats.active})</TabsTrigger>
          <TabsTrigger value="pending">Pendientes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="approved">Aprobadas ({opportunities.filter(o => o.approval_status === 'APPROVED').length})</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas ({opportunities.filter(o => o.approval_status === 'REJECTED').length})</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <LoadingState />
          ) : (
            <OpportunitiesList opportunities={filteredOpportunities} empresaId={empresaId!} />
          )}
        </TabsContent>

        <TabsContent value="active">
          {isLoading ? (
            <LoadingState />
          ) : (
            <OpportunitiesList opportunities={filteredOpportunities} empresaId={empresaId!} />
          )}
        </TabsContent>

        <TabsContent value="inactive">
          {isLoading ? (
            <LoadingState />
          ) : (
            <OpportunitiesList opportunities={filteredOpportunities} empresaId={empresaId!} />
          )}
        </TabsContent>

        <TabsContent value="approved">
          {isLoading ? (
            <LoadingState />
          ) : (
            <OpportunitiesList opportunities={filteredOpportunities} empresaId={empresaId!} />
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {isLoading ? (
            <LoadingState />
          ) : (
            <OpportunitiesList opportunities={filteredOpportunities} empresaId={empresaId!} />
          )}
        </TabsContent>

        <TabsContent value="pending">
          {isLoading ? (
            <LoadingState />
          ) : (
            <OpportunitiesList opportunities={filteredOpportunities} empresaId={empresaId!} />
          )}
        </TabsContent>

        <TabsContent value="metrics">
          {dashboardData ? (
            <DashboardStats data={dashboardData} />
          ) : (
            <LoadingState message="Cargando métricas..." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OpportunitiesList({ opportunities, empresaId }: { opportunities: any[], empresaId: string }) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (oppId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta oportunidad? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingId(oppId)
    try {
      const { error } = await supabase
        .from('OPPORTUNITY')
        .delete()
        .eq('id', oppId)

      if (error) throw error

      // Recargar la página
      router.refresh()
      window.location.reload()
    } catch (err) {
      console.error('Error eliminando oportunidad:', err)
      alert('Error al eliminar la oportunidad')
    } finally {
      setDeletingId(null)
    }
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay oportunidades</h3>
          <p className="text-muted-foreground mb-4">Comienza creando tu primera oportunidad</p>
          <Link href={`/dashboard/company/opportunities/new?empresa_id=${empresaId}`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Oportunidad
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {opportunities.map((opp) => (
        <Card key={opp.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{opp.title}</CardTitle>
                <CardDescription className="mt-2">{opp.description?.substring(0, 150)}...</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant={opp.status === 'OPEN' ? 'default' : 'secondary'}>
                  {opp.status === 'OPEN' ? 'Activo' : 'Inactivo'}
                </Badge>
                <Badge variant={opp.approval_status === 'APPROVED' ? 'default' : opp.approval_status === 'PENDING' ? 'secondary' : 'destructive'}>
                  {opp.approval_status === 'APPROVED' ? 'Aprobado' : opp.approval_status === 'PENDING' ? 'Pendiente' : 'Rechazado'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {new Date(opp.created_at).toLocaleDateString('es-CR')}
              </div>
              <div className="flex gap-2">
                {/* Ver como Público */}
                <Link href={`/opportunities/${opp.id}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Público
                  </Button>
                </Link>

                {/* Editar */}
                <Link href={`/dashboard/company/opportunities/${opp.id}/edit?empresa_id=${empresaId}`}>
                  <Button variant="outline" size="sm">Editar</Button>
                </Link>

                {/* Eliminar */}
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(opp.id)}
                  disabled={deletingId === opp.id}
                >
                  {deletingId === opp.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

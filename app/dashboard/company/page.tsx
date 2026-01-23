export const dynamic = 'force-dynamic'
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Eye, Pencil, TrendingUp, Users, FileText, Download, Trash2, UserCheck } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Opportunity {
  id: string
  title: string
  type: string
  status: string
  approval_status?: string
  description: string
  created_at: string
  views?: number
}

interface Interest {
  id: string
  STUDENT: {
    name: string
    email: string
  }
  created_at: string
}

export default function CompanyDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchText, setSearchText] = useState("")
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    type: "all",
    status: "all",
    approvalStatus: "all", 
  })
  const [selectedOppInterests, setSelectedOppInterests] = useState<Interest[]>([])
  const [showInterestsDialog, setShowInterestsDialog] = useState(false)
  const [interestsDialogTitle, setInterestsDialogTitle] = useState("")

  const loadOpportunities = async () => {
    setIsLoading(true)
    try {
      const empresaId = searchParams.get('empresa_id') || 'caa6a12e-b110-4616-b786-7f18fea2b443'

      let query = supabase
        .from('OPPORTUNITY')
        .select('*')
        .eq('company_id', empresaId)

      if (filters.type !== "all") {
        query = query.eq('type', filters.type)
      }

      if (filters.status !== "all") {
        query = query.eq('status', filters.status)
      }

      if (filters.approvalStatus !== "all") {
        query = query.eq('approval_status', filters.approvalStatus)
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo)
        dateTo.setHours(23, 59, 59)
        query = query.lte('created_at', dateTo.toISOString())
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      let filtered = data || []
      if (searchText) {
        const search = searchText.toLowerCase()
        filtered = filtered.filter(opp => 
          opp.title.toLowerCase().includes(search) ||
          opp.description?.toLowerCase().includes(search)
        )
      }

      setOpportunities(filtered)
    } catch (err) {
      console.error('Error cargando oportunidades:', err)
      setOpportunities([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (oppId: string, oppTitle: string) => {
    const confirmed = confirm(`¿Estás seguro de eliminar la oportunidad "${oppTitle}"?\n\nEsta acción no se puede deshacer.`)
    
    if (!confirmed) return

    try {
      await supabase
        .from('INTEREST')
        .delete()
        .eq('opportunity_id', oppId)

      const { error } = await supabase
        .from('OPPORTUNITY')
        .delete()
        .eq('id', oppId)

      if (error) throw error

      loadOpportunities()
      alert('Oportunidad eliminada exitosamente')
    } catch (err: any) {
      console.error('Error eliminando:', err)
      alert('Error eliminando oportunidad: ' + err.message)
    }
  }

  const handleViewInterests = async (oppId: string, oppTitle: string) => {
      try {
        const { data, error } = await supabase
          .from('INTEREST')
          .select(`
            id, 
            created_at,
            student_id,
            STUDENT (
              name,
              email
            )
          `)
          .eq('opportunity_id', oppId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error detallado:', error)
          throw error
        }

        setSelectedOppInterests(data || [])
        setInterestsDialogTitle(oppTitle)
        setShowInterestsDialog(true)
      } catch (err: any) {
        console.error('Error cargando interesados:', err)
        alert('Error cargando interesados: ' + (err.message || 'Error desconocido'))
      }
    }

  useEffect(() => {
    loadOpportunities()
  }, [searchParams, filters.type, filters.status, filters.approvalStatus, filters.dateFrom, filters.dateTo])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (opportunities.length > 0 || searchText === "") {
        loadOpportunities()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchText])

  const stats = {
    total: opportunities.length,
    active: opportunities.filter(o => o.status === 'OPEN').length,
    pending: opportunities.filter(o => o.approval_status === 'PENDING').length,
    views: opportunities.reduce((sum, o) => sum + (o.views || 0), 0)
  }

  const activeOpportunities = opportunities.filter(o => o.status === 'OPEN')
  const inactiveOpportunities = opportunities.filter(o => o.status !== 'OPEN')

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'TFG': return 'graduation-project'
      case 'PASANTIA': return 'internship'
      case 'EMPLEO': return 'job'
      default: return type.toLowerCase()
    }
  }

  const getTypeBadge = (type: string) => {
    const label = getTypeLabel(type)
    return <Badge variant="secondary">{label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    return status === 'OPEN' ? (
      <Badge className="bg-green-500">Activo</Badge>
    ) : (
      <Badge variant="secondary">Inactivo</Badge>
    )
  }

  const getApprovalBadge = (status?: string) => {
    if (!status) return null
    switch(status) {
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pendiente</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="border-green-500 text-green-700">Aprobada</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="border-red-500 text-red-700">Rechazada</Badge>
      default:
        return null
    }
  }

  const handleExportCSV = () => {
    const headers = ['Título', 'Tipo', 'Estado', 'Descripción', 'Fecha Creación']
    const rows = opportunities.map(opp => [
      opp.title,
      getTypeLabel(opp.type),
      opp.status === 'OPEN' ? 'Activo' : 'Inactivo',
      opp.description,
      new Date(opp.created_at).toLocaleDateString('es-CR')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `oportunidades_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleExportJSON = () => {
    const exportData = opportunities.map(opp => ({
      titulo: opp.title,
      tipo: getTypeLabel(opp.type),
      estado: opp.status === 'OPEN' ? 'Activo' : 'Inactivo',
      descripcion: opp.description,
      fecha_creacion: new Date(opp.created_at).toLocaleDateString('es-CR')
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `oportunidades_${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const OpportunityCard = ({ opp }: { opp: Opportunity }) => (
    <Card key={opp.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{opp.title}</CardTitle>
            <div className="flex gap-2 mb-2 flex-wrap">
              {getTypeBadge(opp.type)}
              {getStatusBadge(opp.status)}
              {getApprovalBadge(opp.approval_status)}
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-2">{opp.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
          <span>{new Date(opp.created_at).toLocaleDateString('es-CR')}</span>
          <div className="flex gap-3 items-center">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {opp.views || 0} vistas
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/dashboard/company/opportunities/${opp.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </Link>
          <Link href={`/opportunities/${opp.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleViewInterests(opp.id, opp.title)}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Interesados
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDelete(opp.id, opp.title)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Empresarial</h1>
        <p className="text-muted-foreground">Gestiona tus oportunidades y visualiza métricas</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Link href="/dashboard/company/opportunities/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Oportunidad
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Descargar CSV
          </Button>
          <Button variant="outline" onClick={handleExportJSON}>
            <Download className="h-4 w-4 mr-2" />
            Descargar JSON
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por título o descripción..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="filter-type">Tipo</Label>
              <select
                id="filter-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="all">Todos</option>
                <option value="TFG">Proyecto</option>
                <option value="PASANTIA">Pasantía</option>
                <option value="EMPLEO">Empleo</option>
              </select>
            </div>

            <div>
              <Label htmlFor="filter-status">Estado</Label>
              <select
                id="filter-status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">Todos</option>
                <option value="OPEN">Activos</option>
                <option value="CLOSED">Inactivos</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchText("")
                  setFilters({ dateFrom: "", dateTo: "", type: "all", status: "all", approvalStatus: "all" })
                }}
                className="w-full"
              >
                Limpiar
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div>
              <Label htmlFor="filter-approval">Aprobación</Label>
              <select
                id="filter-approval"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.approvalStatus}
                onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value })}
              >
                <option value="all">Todas</option>
                <option value="PENDING">Pendientes</option>
                <option value="APPROVED">Aprobadas</option>
                <option value="REJECTED">Rechazadas</option>
              </select>
            </div>
            <div>
              <Label htmlFor="date-from">Desde</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="date-to">Hasta</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilters({ ...filters, status: "all", approvalStatus: "all" })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Publicadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Click para ver todas</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilters({ ...filters, status: "OPEN", approvalStatus: "all" })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Click para filtrar</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setFilters({ ...filters, status: "all", approvalStatus: "PENDING" })}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Esperando aprobación</p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="Todas">Oportunidades ({opportunities.length})</TabsTrigger>
          <TabsTrigger value="Activas">Activas ({activeOpportunities.length})</TabsTrigger>
          <TabsTrigger value="Inactivas">Inactivas ({inactiveOpportunities.length})</TabsTrigger>
          <TabsTrigger value="Aprobadas">Aprobadas ({opportunities.filter(o => o.approval_status === 'APPROVED').length})</TabsTrigger>
          <TabsTrigger value="Rechazadas">Rechazadas ({opportunities.filter(o => o.approval_status === 'REJECTED').length})</TabsTrigger>
          <TabsTrigger value="Métricas">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="Aprobadas">
          <div className="grid gap-4">
            {opportunities.filter(o => o.approval_status === 'APPROVED').length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay oportunidades aprobadas</p>
            ) : (
              opportunities.filter(o => o.approval_status === 'APPROVED').map(opp => <OpportunityCard key={opp.id} opp={opp} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="Rechazadas">
          <div className="grid gap-4">
            {opportunities.filter(o => o.approval_status === 'REJECTED').length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay oportunidades rechazadas</p>
            ) : (
              opportunities.filter(o => o.approval_status === 'REJECTED').map(opp => <OpportunityCard key={opp.id} opp={opp} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="Todas">
          <div className="grid gap-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Cargando...</p>
            ) : opportunities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay oportunidades</p>
            ) : (
              opportunities.map(opp => <OpportunityCard key={opp.id} opp={opp} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="Activas">
          <div className="grid gap-4">
            {activeOpportunities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay oportunidades activas</p>
            ) : (
              activeOpportunities.map(opp => <OpportunityCard key={opp.id} opp={opp} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="Inactivas">
          <div className="grid gap-4">
            {inactiveOpportunities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay oportunidades inactivas</p>
            ) : (
              inactiveOpportunities.map(opp => <OpportunityCard key={opp.id} opp={opp} />)
            )}
          </div>
        </TabsContent>


<TabsContent value="Métricas">
          <div className="grid gap-6">
            {/* Resumen general */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen General</CardTitle>
                <CardDescription>
                  Distribución y rendimiento de tus oportunidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Gráfica por tipo */}
                  <div>
                    <h3 className="text-sm font-medium mb-4">Oportunidades por Tipo</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={[
                        { 
                          tipo: 'Proyectos', 
                          cantidad: opportunities.filter(o => o.type === 'TFG').length 
                        },
                        { 
                          tipo: 'Pasantías', 
                          cantidad: opportunities.filter(o => o.type === 'PASANTIA').length 
                        },
                        { 
                          tipo: 'Empleos', 
                          cantidad: opportunities.filter(o => o.type === 'EMPLEO').length 
                        },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tipo" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#667eea" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gráfica por estado */}
                  <div>
                    <h3 className="text-sm font-medium mb-4">Estado de Oportunidades</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { 
                              nombre: 'Activas', 
                              valor: opportunities.filter(o => o.status === 'OPEN').length,
                              color: '#10b981'
                            },
                            { 
                              nombre: 'Inactivas', 
                              valor: opportunities.filter(o => o.status !== 'OPEN').length,
                              color: '#6b7280'
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ nombre, valor, percent }) => `${nombre}: ${valor} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="valor"
                        >
                          {[
                            { nombre: 'Activas', valor: opportunities.filter(o => o.status === 'OPEN').length, color: '#10b981' },
                            { nombre: 'Inactivas', valor: opportunities.filter(o => o.status !== 'OPEN').length, color: '#6b7280' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evolución temporal */}
            <Card>
              <CardHeader>
                <CardTitle>Evolución Temporal</CardTitle>
                <CardDescription>
                  Oportunidades creadas por mes (últimos 6 meses)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={(() => {
                    const now = new Date()
                    const months = []
                    
                    for (let i = 5; i >= 0; i--) {
                      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
                      const monthName = date.toLocaleDateString('es-CR', { month: 'short', year: 'numeric' })
                      
                      const count = opportunities.filter(o => {
                        const oppDate = new Date(o.created_at)
                        return oppDate.getMonth() === date.getMonth() && 
                               oppDate.getFullYear() === date.getFullYear()
                      }).length
                      
                      months.push({ mes: monthName, cantidad: count })
                    }
                    
                    return months
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cantidad" stroke="#667eea" strokeWidth={2} name="Oportunidades" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tabla de rendimiento */}
            <Card>
              <CardHeader>
                <CardTitle>Top Oportunidades por Visualizaciones</CardTitle>
                <CardDescription>
                  Las 5 oportunidades más vistas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {opportunities
                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                    .slice(0, 5)
                    .map((opp, index) => (
                      <div key={opp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{opp.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {getTypeLabel(opp.type)} • {new Date(opp.created_at).toLocaleDateString('es-CR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="font-bold">{opp.views || 0}</span>
                        </div>
                      </div>
                    ))}
                  {opportunities.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay datos disponibles
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estado de aprobación */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Aprobación</CardTitle>
                <CardDescription>
                  Distribución por estado de revisión
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Pendientes</span>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        {opportunities.filter(o => o.approval_status === 'PENDING').length}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Esperando revisión</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Aprobadas</span>
                      <Badge variant="outline" className="border-green-500 text-green-700">
                        {opportunities.filter(o => o.approval_status === 'APPROVED').length}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Publicadas</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Rechazadas</span>
                      <Badge variant="outline" className="border-red-500 text-red-700">
                        {opportunities.filter(o => o.approval_status === 'REJECTED').length}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Requieren revisión</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showInterestsDialog} onOpenChange={setShowInterestsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Interesados en: {interestsDialogTitle}</DialogTitle>
            <DialogDescription>
              Lista de estudiantes que han mostrado interés en esta oportunidad
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {selectedOppInterests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay estudiantes interesados aún
              </p>
            ) : (
              <div className="space-y-3">
                {selectedOppInterests.map((interest) => (
                  <Card key={interest.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{interest.STUDENT.name}</p>
                          <p className="text-sm text-muted-foreground">{interest.STUDENT.email}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(interest.created_at).toLocaleDateString('es-CR')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
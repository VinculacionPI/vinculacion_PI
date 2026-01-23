"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Download, 
  Filter, 
  TrendingUp, 
  Building2,
  Calendar,
  Eye,
  BarChart3
} from "lucide-react"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'

export default function InformesPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [filters, setFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
    empresa: "all",
    estado: "all",
  })

  const handleGeneratePreview = async () => {
    setIsGenerating(true)
    try {
      const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const BACKEND_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

      const response = await fetch(`${BACKEND_URL}/functions/v1/generar-informe-tfg`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formato: 'JSON',
          fecha_inicio: filters.fechaInicio || undefined,
          fecha_fin: filters.fechaFin || undefined,
          empresa: filters.empresa !== 'all' ? filters.empresa : undefined,
          estado: filters.estado !== 'all' ? filters.estado : undefined,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        const data = JSON.parse(result.data.contenido)
        setPreviewData(data)
      } else {
        alert('Error generando preview: ' + result.error)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Error generando preview')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (formato: 'CSV' | 'JSON') => {
    setIsGenerating(true)
    try {
      const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const BACKEND_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

      const response = await fetch(`${BACKEND_URL}/functions/v1/generar-informe-tfg`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formato,
          fecha_inicio: filters.fechaInicio || undefined,
          fecha_fin: filters.fechaFin || undefined,
          empresa: filters.empresa !== 'all' ? filters.empresa : undefined,
          estado: filters.estado !== 'all' ? filters.estado : undefined,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        const blob = new Blob([result.data.contenido], { 
          type: formato === 'CSV' ? 'text/csv' : 'application/json' 
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.data.filename
        link.click()
        URL.revokeObjectURL(url)
      } else {
        alert('Error descargando: ' + result.error)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Error descargando informe')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadExcel = () => {
    if (!previewData || !previewData.tfgs) {
      alert('Genera un preview primero')
      return
    }

    const excelData = previewData.tfgs.map((tfg: any) => ({
      'ID': tfg.id,
      'Título': tfg.title,
      'Empresa': tfg.COMPANY?.name || 'Sin empresa',
      'Sector': tfg.COMPANY?.sector || 'N/A',
      'Estado': tfg.status === 'OPEN' ? 'Activo' : 'Cerrado',
      'Modalidad': tfg.mode || 'No especificado',
      'Fecha Creación': new Date(tfg.created_at).toLocaleDateString('es-CR'),
      'Descripción': (tfg.description || '').substring(0, 100),
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    
    // Ajustar anchos de columna
    ws['!cols'] = [
      { wch: 10 }, // ID
      { wch: 40 }, // Título
      { wch: 25 }, // Empresa
      { wch: 20 }, // Sector
      { wch: 10 }, // Estado
      { wch: 15 }, // Modalidad
      { wch: 15 }, // Fecha
      { wch: 50 }, // Descripción
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'TFGs')
    
    const filename = `informe-tfg-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Informes de TFG</h1>
          <p className="text-muted-foreground">
            Genera reportes detallados sobre proyectos de graduación
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Panel de filtros */}
          <aside className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
                <CardDescription>
                  Personaliza tu informe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
                  <Input
                    id="fecha-inicio"
                    type="date"
                    value={filters.fechaInicio}
                    onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha-fin">Fecha Fin</Label>
                  <Input
                    id="fecha-fin"
                    type="date"
                    value={filters.fechaFin}
                    onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Select value={filters.empresa} onValueChange={(val) => setFilters({ ...filters, empresa: val })}>
                    <SelectTrigger id="empresa">
                      <SelectValue placeholder="Todas las empresas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las empresas</SelectItem>
                      <SelectItem value="caa6a12e-b110-4616-b786-7f18fea2b443">IBM Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={filters.estado} onValueChange={(val) => setFilters({ ...filters, estado: val })}>
                    <SelectTrigger id="estado">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="OPEN">Activos</SelectItem>
                      <SelectItem value="CLOSED">Cerrados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <Button 
                  className="w-full" 
                  onClick={handleGeneratePreview}
                  disabled={isGenerating}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generando...' : 'Generar Preview'}
                </Button>

                <div className="space-y-2">
                  <Label>Descargar Informe</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleDownload('CSV')}
                      disabled={isGenerating}
                      size="sm"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleDownload('JSON')}
                      disabled={isGenerating}
                      size="sm"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      JSON
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadExcel}
                      disabled={!previewData}
                      size="sm"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Panel principal */}
          <div className="lg:col-span-2">
            {!previewData ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay preview</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Configura los filtros y haz clic en "Generar Preview" para ver un resumen del informe
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="stats">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="stats">Estadísticas</TabsTrigger>
                  <TabsTrigger value="list">Lista de TFGs</TabsTrigger>
                  <TabsTrigger value="charts">Gráficas</TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total TFGs</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{previewData.estadisticas.total_tfgs}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Activos</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {previewData.estadisticas.activos}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cerrados</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-600">
                          {previewData.estadisticas.cerrados}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Por Empresa</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(previewData.estadisticas.por_empresa).map(([empresa, cantidad]: [string, any]) => (
                          <div key={empresa} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{empresa}</span>
                            </div>
                            <Badge>{cantidad}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Por Modalidad</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(previewData.estadisticas.por_modalidad).map(([modalidad, cantidad]: [string, any]) => (
                          <div key={modalidad} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{modalidad}</span>
                            <Badge variant="outline">{cantidad}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="list">
                  <Card>
                    <CardHeader>
                      <CardTitle>Lista de TFGs ({previewData.tfgs.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {previewData.tfgs.slice(0, 20).map((tfg: any) => (
                          <div key={tfg.id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{tfg.title}</h4>
                              <Badge variant={tfg.status === 'OPEN' ? 'default' : 'secondary'}>
                                {tfg.status === 'OPEN' ? 'Activo' : 'Cerrado'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {tfg.COMPANY?.name || 'Sin empresa'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(tfg.created_at).toLocaleDateString('es-CR')}
                              </span>
                            </div>
                          </div>
                        ))}
                        {previewData.tfgs.length > 20 && (
                          <p className="text-center text-sm text-muted-foreground py-2">
                            Y {previewData.tfgs.length - 20} más...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="charts" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Distribución por Empresa
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={Object.entries(previewData.estadisticas.por_empresa).map(([nombre, cantidad]) => ({
                          nombre,
                          cantidad
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="nombre" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="cantidad" fill="#667eea" name="TFGs" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Estado de TFGs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { nombre: 'Activos', valor: previewData.estadisticas.activos },
                              { nombre: 'Cerrados', valor: previewData.estadisticas.cerrados }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ nombre, valor, percent }) => `${nombre}: ${valor} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="valor"
                          >
                            {[
                              { nombre: 'Activos', valor: previewData.estadisticas.activos },
                              { nombre: 'Cerrados', valor: previewData.estadisticas.cerrados }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
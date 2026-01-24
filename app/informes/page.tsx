"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Download, FileText, TrendingUp, Users, CheckCircle2, XCircle } from "lucide-react"
import { generarInformeTFG } from "@/lib/services/persona5-backend"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

interface TFGData {
  id: string
  title: string
  company_name: string
  status: string
  approval_status: string
  created_at: string
  mode: string
  type: string
}

interface ReportData {
  total_tfgs: number
  activos: number
  cerrados: number
  pendientes_aprobacion: number
  aprobados: number
  rechazados: number
  tfgs: TFGData[]
}

export default function InformesPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEmpresa, setSelectedEmpresa] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [empresas, setEmpresas] = useState<Array<{id: string, name: string}>>([])

  useEffect(() => {
    loadEmpresas()
  }, [])

  const loadEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('COMPANY')
        .select('id, name')
        .order('name')
      
      if (data) {
        setEmpresas(data)
      }
    } catch (err) {
      console.error('Error cargando empresas:', err)
    }
  }

    const handleGenerateReport = async () => {
    setIsLoading(true)
    try {
        const response = await generarInformeTFG({
        empresa_id: selectedEmpresa === "all" ? undefined : selectedEmpresa,
        tipo: selectedTipo === "all" ? undefined : selectedTipo,
        })

        console.log('Respuesta completa:', response)

        if (response.success && response.data) {
        // Parsear el contenido JSON que viene como string
        const contenido = JSON.parse(response.data.contenido)
        
        // Transformar al formato esperado
        const transformedData: ReportData = {
            total_tfgs: contenido.estadisticas.total_tfgs || 0,
            activos: contenido.estadisticas.activos || 0,
            cerrados: contenido.estadisticas.cerrados || 0,
            pendientes_aprobacion: contenido.estadisticas.pendientes_aprobacion || 0,
            aprobados: contenido.estadisticas.aprobados || 0,
            rechazados: contenido.estadisticas.rechazados || 0,
            tfgs: contenido.tfgs || []
        }

        console.log('Data transformada:', transformedData)
        setReportData(transformedData)
        }
    } catch (err) {
        console.error("Error generando reporte:", err)
    } finally {
        setIsLoading(false)
    }
    }

  const handleDownload = (format: "CSV" | "JSON" | "XLSX") => {
    if (!reportData) return

    const dataToExport = reportData.tfgs.map((tfg) => ({
      ID: tfg.id,
      Título: tfg.title,
      Empresa: tfg.company_name,
      Estado: tfg.status,
      Aprobación: tfg.approval_status,
      Fecha: new Date(tfg.created_at).toLocaleDateString("es-CR"),
      Modalidad: tfg.mode,
      Tipo: tfg.type,
    }))

    if (format === "CSV") {
      const headers = ["ID", "Título", "Empresa", "Estado", "Aprobación", "Fecha", "Modalidad", "Tipo"]
      const csv = [
        headers.join(","),
        ...dataToExport.map((row) =>
          [row.ID, `"${row.Título}"`, row.Empresa, row.Estado, row.Aprobación, row.Fecha, row.Modalidad, row.Tipo].join(
            ","
          )
        ),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `informe-tfg-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
    } else if (format === "JSON") {
      const json = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `informe-tfg-${new Date().toISOString().split("T")[0]}.json`
      a.click()
    } else if (format === "XLSX") {
      // Importar xlsx dinámicamente
      import("xlsx").then((XLSX) => {
        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Informe TFG")
        XLSX.writeFile(wb, `informe-tfg-${new Date().toISOString().split("T")[0]}.xlsx`)
      })
    }
  }

  // Datos para gráficas
  const statusData = reportData
    ? [
        { name: "Activos", value: reportData.activos, color: COLORS[0] },
        { name: "Cerrados", value: reportData.cerrados, color: COLORS[1] },
      ]
    : []

  const approvalData = reportData
    ? [
        { name: "Pendientes", value: reportData.pendientes_aprobacion, color: COLORS[2] },
        { name: "Aprobados", value: reportData.aprobados, color: COLORS[0] },
        { name: "Rechazados", value: reportData.rechazados, color: COLORS[3] },
      ]
    : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Informes de TFG</h1>
        <p className="text-muted-foreground">Genera reportes personalizados sobre proyectos de graduación</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros de Reporte</CardTitle>
          <CardDescription>Selecciona los criterios para generar el informe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="TFG">TFG</SelectItem>
                  <SelectItem value="PASANTIA">Pasantía</SelectItem>
                  <SelectItem value="EMPLEO">Empleo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full">
                {isLoading ? "Generando..." : "Generar Preview"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {reportData && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total TFGs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.total_tfgs}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activos</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{reportData.activos}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cerrados</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.cerrados}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{reportData.aprobados}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="list" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="list">Lista de TFGs</TabsTrigger>
                <TabsTrigger value="charts">Gráficas</TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownload("CSV")}>
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload("JSON")}>
                  <Download className="h-4 w-4 mr-1" />
                  JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload("XLSX")}>
                  <Download className="h-4 w-4 mr-1" />
                  Excel
                </Button>
              </div>
            </div>

            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle>Listado de TFGs ({reportData.tfgs?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.tfgs?.map((tfg) => (
                      <div key={tfg.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div className="flex-1">
                          <h3 className="font-semibold">{tfg.title}</h3>
                          <p className="text-sm text-muted-foreground">{tfg.company_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(tfg.created_at).toLocaleDateString("es-CR")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={tfg.status === "OPEN" ? "default" : "secondary"}>{tfg.status}</Badge>
                          <Badge
                            variant={
                              tfg.approval_status === "APPROVED"
                                ? "default"
                                : tfg.approval_status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {tfg.approval_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Estado de TFGs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8">
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estado de Aprobación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={approvalData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {approvalData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!reportData && !isLoading && (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay datos</h3>
            <p className="text-muted-foreground">Selecciona filtros y genera un reporte para visualizar los datos</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Download, FileText, TrendingUp, CheckCircle2, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase" // ajusta si tu path real es "@/lib/supabase/client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"

// ======================
// TIPOS (✅ evita "unknown")
// ======================

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

type GenerarInformeTFGInput = {
  empresa_id?: string
  tipo?: string
}

type GenerarInformeTFGResponse =
  | { success: true; data: { contenido: string } }
  | { success: false; error?: string }

// ======================
// API CLIENT (✅ tipado)
// ======================
async function generarInformeTFG(payload: GenerarInformeTFGInput): Promise<GenerarInformeTFGResponse> {
  const res = await fetch("/api/informes/tfg", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  let json: any = null
  try {
    json = await res.json()
  } catch {
    json = null
  }

  if (!res.ok) {
    return { success: false, error: json?.error ?? "Error al generar el informe" }
  }

  if (json?.success) return { success: true, data: { contenido: String(json.data?.contenido ?? "") } }
  return { success: false, error: json?.error ?? "Respuesta inválida del servidor" }
}

// ======================
// Helpers
// ======================

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    OPEN: "Abierto",
    CLOSED: "Cerrado",
    ACTIVE: "Activo",
    INACTIVE: "Inactivo",
    ON_HOLD: "En pausa",
  }
  return translations[status] || status
}

const translateApprovalStatus = (status: string): string => {
  const translations: Record<string, string> = {
    APPROVED: "Aprobado",
    PENDING: "Pendiente",
    REJECTED: "Rechazado",
  }
  return translations[status] || status
}

// 🔥 Labels dinámicos según dropdown (all/tfg/pasantia/empleo)
const tipoLabelUI = (tipo: string) => {
  const t = (tipo ?? "").toUpperCase()
  if (t === "TFG") return "TFG"
  if (t === "PASANTIA") return "Pasantías"
  if (t === "EMPLEO") return "Empleos"
  if (t === "ALL") return "Oportunidades"
  return tipo
}

const tipoTitleUI = (tipo: string) => {
  if ((tipo ?? "").toUpperCase() === "ALL") return "Informes"
  return `Informes de ${tipoLabelUI(tipo)}`
}

const tipoDescUI = (tipo: string) => {
  const t = (tipo ?? "").toUpperCase()
  if (t === "TFG") return "Genera reportes personalizados sobre proyectos de graduación"
  if (t === "PASANTIA") return "Genera reportes personalizados sobre pasantías"
  if (t === "EMPLEO") return "Genera reportes personalizados sobre empleos"
  return "Genera reportes personalizados sobre oportunidades"
}

const chartsTitleStatus = (tipo: string) => {
  const t = (tipo ?? "").toUpperCase()
  if (t === "ALL") return "Estado de oportunidades"
  return `Estado de ${tipoLabelUI(tipo)}`
}

const chartsTitleApproval = (tipo: string) => {
  const t = (tipo ?? "").toUpperCase()
  if (t === "ALL") return "Estado de aprobación (todas)"
  return `Estado de aprobación (${tipoLabelUI(tipo)})`
}

// ======================
// Page
// ======================

export default function InformesPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEmpresa, setSelectedEmpresa] = useState("all")
  const [selectedTipo, setSelectedTipo] = useState("all")
  const [empresas, setEmpresas] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    void loadEmpresas()
  }, [])

  const loadEmpresas = async () => {
    try {
      const { data, error } = await supabase.from("COMPANY").select("id, name").order("name")
      if (error) throw error
      if (data) setEmpresas(data as Array<{ id: string; name: string }>)
    } catch (err) {
      console.error("Error cargando empresas:", err)
    }
  }

  const handleGenerateReport = async () => {
    setIsLoading(true)
    try {
      const response = await generarInformeTFG({
        empresa_id: selectedEmpresa === "all" ? undefined : selectedEmpresa,
        tipo: selectedTipo === "all" ? undefined : selectedTipo,
      })

      if (response.success) {
        const contenido = JSON.parse(response.data.contenido || "{}")

        const transformedData: ReportData = {
          total_tfgs: contenido?.estadisticas?.total_tfgs ?? 0,
          activos: contenido?.estadisticas?.activos ?? 0,
          cerrados: contenido?.estadisticas?.cerrados ?? 0,
          pendientes_aprobacion: contenido?.estadisticas?.pendientes_aprobacion ?? 0,
          aprobados: contenido?.estadisticas?.aprobados ?? 0,
          rechazados: contenido?.estadisticas?.rechazados ?? 0,
          tfgs: (contenido?.tfgs ?? []) as TFGData[],
        }

        setReportData(transformedData)
      } else {
        console.error("Error generando reporte:", response.error)
        setReportData(null)
      }
    } catch (err) {
      console.error("Error generando reporte:", err)
      setReportData(null)
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
      Estado: translateStatus(tfg.status),
      Aprobación: translateApprovalStatus(tfg.approval_status),
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
      a.download = `informe-${selectedTipo === "all" ? "oportunidades" : selectedTipo.toLowerCase()}-${
        new Date().toISOString().split("T")[0]
      }.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === "JSON") {
      const json = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `informe-${selectedTipo === "all" ? "oportunidades" : selectedTipo.toLowerCase()}-${
        new Date().toISOString().split("T")[0]
      }.json`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === "XLSX") {
      import("xlsx").then((XLSX) => {
        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Informe")
        XLSX.writeFile(
          wb,
          `informe-${selectedTipo === "all" ? "oportunidades" : selectedTipo.toLowerCase()}-${
            new Date().toISOString().split("T")[0]
          }.xlsx`
        )
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
        {/* ✅ Título y descripción dinámicos */}
        <h1 className="text-3xl font-bold text-foreground mb-2">{tipoTitleUI(selectedTipo)}</h1>
        <p className="text-muted-foreground">{tipoDescUI(selectedTipo)}</p>
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
                <SelectContent className="bg-background border shadow-lg z-50">
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
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">Todos</SelectItem>
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
                {/* ✅ Total dinámico */}
                <CardTitle className="text-sm font-medium">Total {tipoLabelUI(selectedTipo)}</CardTitle>
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
                <TabsTrigger value="list">Lista</TabsTrigger>
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
                  {/* ✅ Listado dinámico */}
                  <CardTitle>
                    Listado de {tipoLabelUI(selectedTipo)} ({reportData.tfgs?.length || 0})
                  </CardTitle>
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

                          {/* Opcional: mostrar tipo si estás en ALL */}
                          {selectedTipo === "all" && (
                            <p className="text-xs text-muted-foreground mt-1">Tipo: {tfg.type}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Badge variant={tfg.status === "OPEN" ? "default" : "secondary"}>
                            {translateStatus(tfg.status)}
                          </Badge>

                          <Badge
                            variant={
                              tfg.approval_status === "APPROVED"
                                ? "default"
                                : tfg.approval_status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {translateApprovalStatus(tfg.approval_status)}
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
                    {/* ✅ Título dinámico */}
                    <CardTitle>{chartsTitleStatus(selectedTipo)}</CardTitle>
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
                    {/* ✅ Título dinámico */}
                    <CardTitle>{chartsTitleApproval(selectedTipo)}</CardTitle>
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

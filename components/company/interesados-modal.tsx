"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Users, Eye } from "lucide-react"
import { obtenerInteresados } from "@/lib/services/api"

interface Interesado {
  id: string
  user_id: string
  nombre: string
  email: string
  carrera: string
  semestre: number | null
  año_graduacion: number | null
  titulo: string | null
  fecha_interes: string
  rol: string
}

interface InteresadosModalProps {
  opportunityId: string
  opportunityTitle: string
  isOpen: boolean
  onClose: () => void
}

export function InteresadosModal({ opportunityId, opportunityTitle, isOpen, onClose }: InteresadosModalProps) {
  const [interesados, setInteresados] = useState<Interesado[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({ interest_count: 0, view_count: 0 })

  useEffect(() => {
    if (isOpen) {
      loadInteresados()
    }
  }, [isOpen, opportunityId])

  const loadInteresados = async () => {
    setIsLoading(true)
    try {
      const response = await obtenerInteresados({
        opportunity_id: opportunityId,
        filters: {}
      })

      if (response.success && response.data) {
        setInteresados(response.data.interesados)
        setStats({
          interest_count: response.data.interest_count,
          view_count: response.data.view_count
        })
      }
    } catch (error) {
      console.error("Error cargando interesados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = (format: "CSV" | "XLSX") => {
    const dataToExport = interesados.map(i => ({
      Nombre: i.nombre,
      Email: i.email,
      Carrera: i.carrera,
      Semestre: i.semestre || "N/A",
      "Año Graduación": i.año_graduacion || "N/A",
      Título: i.titulo || "N/A",
      "Fecha Interés": new Date(i.fecha_interes).toLocaleDateString("es-CR"),
      Rol: i.rol === "student" ? "Estudiante" : "Graduado"
    }))

    if (format === "CSV") {
      const headers = ["Nombre", "Email", "Carrera", "Semestre", "Año Graduación", "Título", "Fecha Interés", "Rol"]
      const csv = [
        headers.join(","),
        ...dataToExport.map(row =>
          [
            `"${row.Nombre}"`,
            row.Email,
            `"${row.Carrera}"`,
            row.Semestre,
            row["Año Graduación"],
            `"${row.Título}"`,
            row["Fecha Interés"],
            row.Rol
          ].join(",")
        ),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `interesados-${opportunityTitle}-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
    } else if (format === "XLSX") {
      import("xlsx").then((XLSX) => {
        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Interesados")
        XLSX.writeFile(wb, `interesados-${opportunityTitle}-${new Date().toISOString().split("T")[0]}.xlsx`)
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Interesados: {opportunityTitle}</DialogTitle>
          <DialogDescription>
            Estudiantes y graduados que mostraron interés en esta oportunidad
          </DialogDescription>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interesados</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{interesados.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Personas que mostraron interés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizaciones</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.view_count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Veces que se vio la oportunidad
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Lista de Interesados ({interesados.length})
          </h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport("CSV")}
              disabled={interesados.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Descargar CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport("XLSX")}
              disabled={interesados.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Descargar Excel
            </Button>
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : interesados.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">Sin interesados aún</h3>
              <p className="text-muted-foreground">
                Cuando los estudiantes muestren interés en esta oportunidad, aparecerán aquí.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {interesados.map((interesado) => (
              <Card key={interesado.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{interesado.nombre}</h4>
                        <Badge variant={interesado.rol === "student" ? "default" : "secondary"}>
                          {interesado.rol === "student" ? "Estudiante" : "Graduado"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Email:</span>
                          <a href={`mailto:${interesado.email}`} className="hover:underline text-blue-600">
                            {interesado.email}
                          </a>
                        </p>
                        
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Carrera:</span>
                          {interesado.carrera}
                        </p>
                        
                        {interesado.semestre && (
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Semestre:</span>
                            {interesado.semestre}
                          </p>
                        )}
                        
                        {interesado.año_graduacion && (
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Año Graduación:</span>
                            {interesado.año_graduacion}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-xs text-muted-foreground">
                        Mostró interés:
                      </p>
                      <p className="text-sm font-medium">
                        {new Date(interesado.fecha_interes).toLocaleDateString("es-CR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(interesado.fecha_interes).toLocaleTimeString("es-CR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
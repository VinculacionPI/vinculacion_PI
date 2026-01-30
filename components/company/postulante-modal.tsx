"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Users, FileText } from "lucide-react"
import { obtenerPostulaciones } from "@/lib/services/api"

interface Postulante {
  id: string
  created_at: string
  cv_url: string
  user: {
    id: string
    name: string
    email: string
    major: string | null
    semester: string | null
    graduation_year: number | null
    degree_title: string | null
    role: "student" | "graduate"
  }
}

interface PostulantesModalProps {
  opportunityId: string
  opportunityTitle: string
  isOpen: boolean
  onClose: () => void
}

export function PostulantesModal({
  opportunityId,
  opportunityTitle,
  isOpen,
  onClose,
}: PostulantesModalProps) {
  const [postulantes, setPostulantes] = useState<Postulante[]>([])
  const [loading, setLoading] = useState(false)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-CR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
    }


  useEffect(() => {
    if (isOpen) loadPostulantes()
  }, [isOpen, opportunityId])

  const loadPostulantes = async () => {
    setLoading(true)
    try {
      const res = await obtenerPostulaciones(opportunityId)
      if (res.success) setPostulantes(res.data.applications)
    } catch (e) {
      console.error("Error cargando postulantes:", e)
    } finally {
      setLoading(false)
    }
  }

  const downloadCV = (applicationId: string) => {
    window.open(
      `/api/opportunities/${applicationId}/download-cv`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Postulantes — {opportunityTitle}
          </DialogTitle>
          <DialogDescription>
            Personas que aplicaron a esta oportunidad y subieron su CV
          </DialogDescription>
        </DialogHeader>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Total postulantes: {postulantes.length}
          </h3>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : postulantes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">
                Nadie ha postulado aún
              </h3>
              <p className="text-muted-foreground">
                Cuando los estudiantes suban su CV, aparecerán aquí.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {postulantes.map((p) => (
              <Card key={p.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">
                          {p.user.name}
                        </h4>
                        <Badge>
                          {p.user.role === "student"
                            ? "Estudiante"
                            : "Graduado"}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <b>Email:</b>{" "}
                          <a
                            href={`mailto:${p.user.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {p.user.email}
                          </a>
                        </p>

                        <p>
                          <b>Carrera:</b> {p.user.major ?? "—"}
                        </p>

                        {p.user.semester && (
                          <p>
                            <b>Semestre:</b> {p.user.semester}
                          </p>
                        )}

                        {p.user.graduation_year && (
                          <p>
                            <b>Año graduación:</b>{" "}
                            {p.user.graduation_year}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xs text-muted-foreground">
                        Postuló el
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(p.created_at)}
                    </p>


                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadCV(p.id)}
                        className="gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Descargar CV
                      </Button>
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

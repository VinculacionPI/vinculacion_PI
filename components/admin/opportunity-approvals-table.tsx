"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { CheckCircle, XCircle, Eye, Briefcase, Clock } from "lucide-react"
import type { Opportunity } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type PendingOpportunity = Opportunity & {
  created_at?: string | null
  approval_status?: string | null
  lifecycle_status?: string | null
  is_over_48h?: boolean
  // si tu API no manda esto, lo calculamos local con created_at
  company_name?: string
}

function safeUpper(v: any) {
  return String(v ?? "").toUpperCase()
}

function isOlderThan48h(iso?: string | null) {
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return false
  return Date.now() - t > 48 * 60 * 60 * 1000
}

function formatDateTime(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString()
}

export function OpportunityApprovalsTable() {
  const [opportunities, setOpportunities] = useState<PendingOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingOpportunities()
  }, [])

  const fetchPendingOpportunities = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/opportunities/pending", { cache: "no-store" })
      const data = await response.json().catch(() => [])

      if (!response.ok) {
        console.error("Error /api/admin/opportunities/pending:", data)
        setOpportunities([])
        return
      }

      const list = Array.isArray(data) ? (data as PendingOpportunity[]) : (data?.data ?? [])
      setOpportunities(list)
    } catch (error) {
      console.error("Error fetching pending opportunities:", error)
      setOpportunities([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (busyId) return

    const ok = window.confirm("¿Confirmas que deseas aprobar esta oportunidad?")
    if (!ok) return

    setBusyId(id)
    try {
      const response = await fetch(`/api/admin/opportunities/${id}/approve`, {
        method: "POST",
        cache: "no-store",
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        alert(payload?.message ?? payload?.error ?? "No se pudo aprobar.")
        return
      }

      setOpportunities((prev) => prev.filter((o) => o.id !== id))
    } catch (error) {
      console.error("Error approving opportunity:", error)
      alert("Error de red al aprobar.")
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (id: string) => {
    if (busyId) return

    const reason = window
      .prompt("Motivo de rechazo (mínimo 20 caracteres):", "")
      ?.trim()

    if (!reason) return

    if (reason.length < 20) {
      alert("El motivo debe tener mínimo 20 caracteres.")
      return
    }

    const ok = window.confirm("¿Confirmas que deseas rechazar esta oportunidad?")
    if (!ok) return

    setBusyId(id)
    try {
      const response = await fetch(`/api/admin/opportunities/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: reason }),
        cache: "no-store",
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        alert(payload?.message ?? payload?.error ?? "No se pudo rechazar.")
        return
      }

      setOpportunities((prev) => prev.filter((o) => o.id !== id))
    } catch (error) {
      console.error("Error rejecting opportunity:", error)
      alert("Error de red al rechazar.")
    } finally {
      setBusyId(null)
    }
  }

  const typeLabels: Record<string, string> = {
    internship: "Práctica",
    "graduation-project": "TFG",
    job: "Empleo",
  }

  const rows = useMemo(() => {
    return opportunities.map((o) => {
      const over48 =
        typeof o.is_over_48h === "boolean" ? o.is_over_48h : isOlderThan48h(o.created_at ?? null)

      return {
        ...o,
        __over48: over48,
      }
    })
  }, [opportunities])

  if (isLoading) {
    return <LoadingState message="Cargando oportunidades pendientes..." />
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={Briefcase}
            title="No hay oportunidades pendientes"
            description="Todas las oportunidades publicadas han sido revisadas."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Oportunidades Pendientes de Aprobación</CardTitle>
        <CardDescription>
          Revisa y aprueba/rechaza publicaciones. Las solicitudes con más de 48 horas se resaltan.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Publicado</TableHead>
                <TableHead>Antigüedad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((opportunity) => {
                const companyName =
                  (opportunity as any)?.company_name ??
                  (opportunity as any)?.company?.name ??
                  (opportunity as any)?.company ??
                  "—"

                const typeKey = String((opportunity as any)?.type ?? "")
                const typeLabel = typeLabels[typeKey] || typeKey || "—"


                const posted = (opportunity as any)?.created_at
                  ? formatDateTime((opportunity as any)?.created_at)
                  : ((opportunity as any)?.postedAt ?? "—")

                const isPending = safeUpper((opportunity as any)?.approval_status ?? "PENDING") === "PENDING"

                return (
                  <TableRow key={opportunity.id} className={opportunity.__over48 ? "bg-red-500/5" : ""}>
                    <TableCell className="font-medium">{(opportunity as any)?.title ?? "—"}</TableCell>

                    <TableCell>{companyName}</TableCell>

                    <TableCell>
                      <Badge variant="secondary">{typeLabel}</Badge>
                    </TableCell>

                    <TableCell>{posted}</TableCell>

                    <TableCell>
                      {opportunity.__over48 ? (
                        <span className="inline-flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                          <Clock className="h-4 w-4" />
                          +48h
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {isPending ? (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                          Pendiente
                        </Badge>
                      ) : (
                        <Badge variant="outline">—</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" type="button">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver detalles</span>
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{(opportunity as any)?.title ?? "Detalle"}</DialogTitle>
                              <DialogDescription>{companyName}</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div className="flex gap-2 flex-wrap">
                                <Badge variant="secondary">{typeLabel}</Badge>
                                {(opportunity as any)?.mode ? <Badge variant="outline">{(opportunity as any).mode}</Badge> : null}
                                {(opportunity as any)?.duration_estimated ? (
                                  <Badge variant="outline">{(opportunity as any).duration_estimated}</Badge>
                                ) : null}
                              </div>

                              <div>
                                <p className="text-sm font-medium">Descripción</p>
                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                  {(opportunity as any)?.description ?? "—"}
                                </p>
                              </div>

                              {(opportunity as any)?.requirements ? (
                                <div>
                                  <p className="text-sm font-medium">Requisitos</p>
                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                    {(opportunity as any).requirements}
                                  </p>
                                </div>
                              ) : null}

                              {(opportunity as any)?.contact_info ? (
                                <div>
                                  <p className="text-sm font-medium">Contacto</p>
                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                    {(opportunity as any).contact_info}
                                  </p>
                                </div>
                              ) : null}

                              <div>
                                <p className="text-sm font-medium">Fecha de publicación</p>
                                <p className="text-sm text-muted-foreground">{posted}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="default"
                          size="sm"
                          type="button"
                          onClick={() => handleApprove(opportunity.id)}
                          disabled={busyId === opportunity.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          type="button"
                          onClick={() => handleReject(opportunity.id)}
                          disabled={busyId === opportunity.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4">
          <Button variant="outline" type="button" onClick={fetchPendingOpportunities}>
            Refrescar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { CheckCircle, XCircle, Eye, GraduationCap, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type GraduationRequestRow = {
  id: string
  user_id: string
  status: "pending" | "approved" | "rejected" | string
  requested_at?: string | null
  updated_at?: string | null

  graduation_year: number
  degree_title: string
  major?: string | null
  thesis_title?: string | null
  final_gpa?: number | string | null

  user_email?: string | null
  user_name?: string | null

  is_over_48h?: boolean
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

async function readApiPayload(res: Response) {
  // Lee SIEMPRE como texto primero (sirve para JSON o HTML de error)
  const text = await res.text()

  // intenta parsear JSON, si no, queda como texto
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  return { text, json }
}

export function GraduatesApprovalsTable() {
  const [requests, setRequests] = useState<GraduationRequestRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    fetchPending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPending = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/graduation-requests/pending", { cache: "no-store" })
      const { json, text } = await readApiPayload(res)

      if (!res.ok) {
        console.error("Error /api/admin/graduation-requests/pending:", res.status, json ?? text)
        setRequests([])
        return
      }

      const data = json ?? []
      const list = Array.isArray(data) ? (data as GraduationRequestRow[]) : (data?.data ?? [])
      setRequests(list)
    } catch (e) {
      console.error("Error fetching pending graduation requests:", e)
      setRequests([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (busyId) return
    const ok = window.confirm("¿Confirmas que deseas aprobar esta solicitud de graduación?")
    if (!ok) return

    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/graduation-requests/${id}/approve`, {
        method: "POST",
        cache: "no-store",
      })

      const { json, text } = await readApiPayload(res)

      console.log("APPROVE STATUS:", res.status)
      console.log("APPROVE BODY:", json ?? text)

      if (!res.ok) {
        const msg =
          json?.message ??
          json?.error ??
          (typeof text === "string" && text.trim() ? text : "No se pudo aprobar.")
        alert(`Approve falló (${res.status}): ${msg}`)
        return
      }

      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      console.error("Error approving graduation request:", e)
      alert("Error de red al aprobar.")
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (id: string) => {
    if (busyId) return

    const reason = window.prompt("Motivo de rechazo (mínimo 20 caracteres):", "")?.trim()
    if (!reason) return
    if (reason.length < 20) {
      alert("El motivo debe tener mínimo 20 caracteres.")
      return
    }

    const ok = window.confirm("¿Confirmas que deseas rechazar esta solicitud de graduación?")
    if (!ok) return

    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/graduation-requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
        cache: "no-store",
      })

      const { json, text } = await readApiPayload(res)

      console.log("REJECT STATUS:", res.status)
      console.log("REJECT BODY:", json ?? text)

      if (!res.ok) {
        const msg =
          json?.message ??
          json?.error ??
          (typeof text === "string" && text.trim() ? text : "No se pudo rechazar.")
        alert(`Reject falló (${res.status}): ${msg}`)
        return
      }

      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      console.error("Error rejecting graduation request:", e)
      alert("Error de red al rechazar.")
    } finally {
      setBusyId(null)
    }
  }

  const rows = useMemo(() => {
    return requests.map((r) => {
      const when = r.requested_at ?? r.updated_at ?? null
      const over48 = typeof r.is_over_48h === "boolean" ? r.is_over_48h : isOlderThan48h(when)
      return { ...r, __over48: over48 }
    })
  }, [requests])

  if (isLoading) return <LoadingState message="Cargando solicitudes de graduación..." />

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={GraduationCap}
            title="No hay solicitudes de graduación pendientes"
            description="Todas las solicitudes han sido revisadas."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2">
          Solicitudes de Graduación Pendientes
          <Badge variant="secondary">{rows.length}</Badge>
        </CardTitle>
        <CardDescription>Aprueba/rechaza solicitudes. Las que superen 48 horas se resaltan.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Carrera</TableHead>
                <TableHead>Solicitado</TableHead>
                <TableHead>Antigüedad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((r: any) => {
                const student = r.user_name ?? r.user_email ?? r.user_id ?? "—"
                const requestedAt = r.requested_at ?? r.updated_at ?? null
                const reallyPending = String(r.status ?? "").toLowerCase() === "pending"
                const disabled = busyId === r.id

                return (
                  <TableRow key={r.id} className={r.__over48 ? "bg-red-500/5" : ""}>
                    <TableCell className="font-medium">{student}</TableCell>
                    <TableCell>{r.graduation_year ?? "—"}</TableCell>
                    <TableCell>{r.degree_title ?? "—"}</TableCell>
                    <TableCell>{r.major ?? "—"}</TableCell>
                    <TableCell>{formatDateTime(requestedAt)}</TableCell>

                    <TableCell>
                      {r.__over48 ? (
                        <span className="inline-flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                          <Clock className="h-4 w-4" />
                          +48h
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {reallyPending ? (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                          Pendiente
                        </Badge>
                      ) : (
                        <Badge variant="outline">{safeUpper(r.status) || "—"}</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" type="button" disabled={disabled}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver detalles</span>
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Solicitud de graduación</DialogTitle>
                              <DialogDescription>{student}</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div className="flex gap-2 flex-wrap">
                                <Badge variant="secondary">{r.graduation_year ?? "—"}</Badge>
                                {r.final_gpa != null ? (
                                  <Badge variant="outline">GPA: {String(r.final_gpa)}</Badge>
                                ) : null}
                              </div>

                              <div>
                                <p className="text-sm font-medium">Título</p>
                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                  {r.degree_title ?? "—"}
                                </p>
                              </div>

                              {r.major ? (
                                <div>
                                  <p className="text-sm font-medium">Carrera</p>
                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{r.major}</p>
                                </div>
                              ) : null}

                              {r.thesis_title ? (
                                <div>
                                  <p className="text-sm font-medium">Tema / Tesis</p>
                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{r.thesis_title}</p>
                                </div>
                              ) : null}

                              <div>
                                <p className="text-sm font-medium">Solicitado</p>
                                <p className="text-sm text-muted-foreground">{formatDateTime(requestedAt)}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="default"
                          size="sm"
                          type="button"
                          onClick={() => handleApprove(r.id)}
                          disabled={disabled}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {disabled ? "Procesando..." : "Aprobar"}
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          type="button"
                          onClick={() => handleReject(r.id)}
                          disabled={disabled}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {disabled ? "Procesando..." : "Rechazar"}
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
          <Button variant="outline" type="button" onClick={fetchPending} disabled={!!busyId}>
            Refrescar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

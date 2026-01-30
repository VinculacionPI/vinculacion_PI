"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { CheckCircle, XCircle, RefreshCcw } from "lucide-react"

type UserRow = {
  id: string
  name: string | null
  email: string
  cedula: string | null
  carnet: string | null
  semester: string | null
  role: string
  status: string
  created_at: string
}

const norm = (s?: string | null) => (s ?? "").trim().toUpperCase()

export function UsersAdminTable({
  roleFilter = "all",
  title = "Usuarios",
}: {
  roleFilter?: "STUDENT" | "GRADUATE" | "all"
  title?: string
}) {
  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchRows = async () => {
    setLoading(true)
    setErr(null)
    try {
      const roleParam = roleFilter === "all" ? "all" : roleFilter
      const res = await fetch(`/api/admin/users?role=${encodeURIComponent(roleParam)}`, { cache: "no-store" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? "Error cargando usuarios")
      setRows((data ?? []) as UserRow[])
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRows()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((r) => {
      const hay = [
        r.name ?? "",
        r.email ?? "",
        r.cedula ?? "",
        r.carnet ?? "",
        r.semester ?? "",
        r.role ?? "",
        r.status ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(term)
    })
  }, [rows, q])

  const toggleStatus = async (row: UserRow) => {
    const next = norm(row.status) === "ACTIVE" ? "INACTIVE" : "ACTIVE"

    const ok = window.confirm(
      next === "INACTIVE"
        ? `¿Desactivar a ${row.name ?? row.email}?`
        : `¿Activar a ${row.name ?? row.email}?`
    )
    if (!ok) return

    try {
      setBusyId(row.id)

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: row.id, status: next }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? "No se pudo actualizar el estado")

      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: next } : r)))
    } catch (e: any) {
      alert(e?.message ?? "Error actualizando estado")
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="py-6">
        <LoadingState message="Cargando usuarios..." />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>{title}</CardTitle>

        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Buscar por nombre, email, cédula..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="md:w-80"
          />
          <Button variant="outline" onClick={fetchRows} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Recargar
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {err ? <div className="text-red-600 text-sm mb-3">{err}</div> : null}

        <div className="overflow-auto border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Nombre</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Cédula</th>
                <th className="p-3">Carné</th>
                <th className="p-3">Semestre</th>
                <th className="p-3">Estado</th>
                <th className="p-3 w-[180px]">Acción</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={8}>
                    No hay usuarios para mostrar.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isActive = norm(r.status) === "ACTIVE"
                  const busy = busyId === r.id

                  return (
                    <tr key={r.id} className="border-t">
                      <td className="p-3">{r.name ?? "—"}</td>
                      <td className="p-3">{r.email}</td>
                      <td className="p-3">
                        <Badge variant="secondary">
                          {norm(r.role) === "STUDENT" ? "STUDENT" : norm(r.role) === "GRADUATE" ? "GRADUATE" : r.role}
                        </Badge>
                      </td>
                      <td className="p-3">{r.cedula ?? "—"}</td>
                      <td className="p-3">{r.carnet ?? "—"}</td>
                      <td className="p-3">{r.semester ?? "—"}</td>
                      <td className="p-3">
                        <Badge variant={isActive ? "default" : "destructive"}>
                          {isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button
                          variant={isActive ? "destructive" : "default"}
                          className="gap-2"
                          onClick={() => toggleStatus(r)}
                          disabled={busy}
                        >
                          {isActive ? (
                            <>
                              <XCircle className="h-4 w-4" />
                              {busy ? "Desactivando..." : "Desactivar"}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              {busy ? "Activando..." : "Activar"}
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Search, ExternalLink, Trash2 } from "lucide-react"

type InterestListItem = {
  interestId: string
  interestedAt: string
  opportunity: {
    id: string
    title: string
    type: string | null
    lifecycle_status: string | null
    approval_status?: string | null
    status?: string | null
    created_at: string
    company: string
  }
}

type InterestsApiResponse = {
  data: InterestListItem[]
  page: number
  total: number
  totalPages: number
}

const ITEMS_PER_PAGE = 12
const norm = (s?: string | null) => (s ?? "").trim().toUpperCase()

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

function statusLabel(v?: string | null) {
  const s = norm(v)
  if (!s) return "—"
  if (s === "ACTIVE") return "ACTIVE"
  if (s === "INACTIVE") return "INACTIVE"
  return s
}

function approvalLabel(v?: string | null) {
  const s = norm(v)
  if (!s) return "—"
  if (s === "APPROVED") return "APPROVED"
  if (s === "PENDING") return "PENDING"
  if (s === "REJECTED") return "REJECTED"
  return s
}

export default function StudentInterestsPage() {
  const [items, setItems] = useState<InterestListItem[]>([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [q, setQ] = useState("")
  const [lifecycle, setLifecycle] = useState("") // ACTIVE / INACTIVE
  const [approval, setApproval] = useState("") // APPROVED / PENDING / REJECTED

  const fetchInterests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("pageSize", String(ITEMS_PER_PAGE))
      if (q.trim()) params.set("q", q.trim())

      // backend actual solo entiende "status" como lifecycle_status
      if (lifecycle) params.set("status", lifecycle)

      const res = await fetch(`/api/my-interests?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      })

      const json = (await res.json()) as InterestsApiResponse

      if (!res.ok) {
        console.error("API /api/my-interests error:", json)
        setItems([])
        setTotalPages(1)
        return
      }

      // filtro local por approval_status (porque el API todavía no lo filtra)
      const data = (json.data ?? []).filter((it) => {
        if (!approval) return true
        return norm(it.opportunity.approval_status) === approval
      })

      setItems(data)
      setTotalPages(json.totalPages ?? 1)
    } catch (e) {
      console.error("Error fetching interests:", e)
      setItems([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInterests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, lifecycle, approval])

  useEffect(() => {
    setPage(1)
  }, [q, lifecycle, approval])

  const onRemove = async (opportunityId: string) => {
    const ok = window.confirm("¿Confirmas que deseas retirar tu manifestación de interés?")
    if (!ok) return

    const res = await fetch("/api/interest", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId }),
      cache: "no-store",
      credentials: "include",
    })

    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      alert((j as any)?.error ?? "No se pudo retirar el interés.")
      return
    }

    setItems((prev) => prev.filter((x) => x.opportunity.id !== opportunityId))
  }

  const emptyText = useMemo(() => {
    if (q.trim() || lifecycle || approval) return "No hay resultados con esos filtros."
    return "Aún no has manifestado interés en oportunidades."
  }, [q, lifecycle, approval])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/dashboard/student" className="inline-flex items-center gap-2 underline">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <h1 className="text-2xl font-bold">Mis Intereses</h1>
      </div>

      <div className="rounded-lg border p-4 mb-6 grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Buscar</label>
          <div className="mt-1 flex items-center gap-2 rounded-md border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Título o descripción..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Lifecycle</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={lifecycle}
            onChange={(e) => setLifecycle(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">Filtra por lifecycle_status.</p>
        </div>

        <div>
          <label className="text-sm font-medium">Aprobación</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={approval}
            onChange={(e) => setApproval(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PENDING">PENDING</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">Filtra por approval_status.</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border p-6">Cargando intereses...</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border p-6">{emptyText}</div>
      ) : (
        <div className="grid gap-4">
          {items.map((it) => {
            const opp = it.opportunity

            const lifecycleNorm = norm(opp.lifecycle_status)
            const approvalNorm = norm(opp.approval_status)
            const statusNorm = norm(opp.status)

            const visibleToStudent =
              lifecycleNorm === "ACTIVE" && statusNorm === "OPEN" && approvalNorm === "APPROVED"

            return (
              <div
                key={it.interestId}
                className="rounded-lg border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">{opp.title}</p>

                    <span className="text-xs rounded-full border px-2 py-0.5" title="approval_status">
                      {approvalLabel(opp.approval_status)}
                    </span>

                    <span
                      className={[
                        "text-xs rounded-full border px-2 py-0.5",
                        lifecycleNorm === "ACTIVE" ? "" : "opacity-80",
                      ].join(" ")}
                      title="lifecycle_status"
                    >
                      {statusLabel(opp.lifecycle_status)}
                    </span>

                    {opp.status ? (
                      <span className="text-xs rounded-full border px-2 py-0.5" title="status">
                        {norm(opp.status)}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm text-muted-foreground mt-1">
                    Empresa: {opp.company} · Interés: {formatDate(it.interestedAt)}
                  </p>

                  {!visibleToStudent ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Esta publicación no está visible (requiere APPROVED + ACTIVE + OPEN). Acciones bloqueadas.
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/student/opportunities/${opp.id}`}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    Ver detalle
                    <ExternalLink className="h-4 w-4" />
                  </Link>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                    onClick={() => onRemove(opp.id)}
                    disabled={!visibleToStudent}
                    title={
                      !visibleToStudent
                        ? "No se puede retirar si no está visible (APPROVED+ACTIVE+OPEN)"
                        : "Retirar interés"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Retirar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </div>
  )
}

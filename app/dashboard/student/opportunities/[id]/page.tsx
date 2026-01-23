"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Download, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"

type OpportunityDetail = {
  id: string
  title: string
  description: string | null
  mode: string | null
  duration_estimated: string | null
  requirements: string | null
  contact_info: string | null
  lifecycle_status: string | null
  created_at: string
  company: string | null
  flyerUrl: string | null
}

export default function OpportunityDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [data, setData] = useState<OpportunityDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const [interested, setInterested] = useState(false)
  const [interestLoading, setInterestLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const res = await fetch(`/api/opportunities/${id}`, { cache: "no-store" })
        if (!res.ok) {
          setData(null)
          return
        }
        const json = await res.json()
        setData(json)
      } catch (e) {
        console.error("Error loading opportunity detail:", e)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  useEffect(() => {
    const loadInterest = async () => {
      if (!id) return
      setInterestLoading(true)
      try {
        const res = await fetch(`/api/interest/status?opportunityId=${id}`, { cache: "no-store" })
        if (res.ok) {
          const json = await res.json()
          setInterested(!!json.interested)
        } else {
          setInterested(false)
        }
      } catch {
        setInterested(false)
      } finally {
        setInterestLoading(false)
      }
    }

    loadInterest()
  }, [id])

  const toggleInterest = async () => {
    if (!data) return
    const isActive = data.lifecycle_status === "ACTIVE"
    if (!isActive) {
      alert("Esta publicación no está activa.")
      return
    }

    const ok = window.confirm(
      interested
        ? "¿Confirmas que deseas retirar tu manifestación de interés?"
        : "¿Confirmas que deseas manifestar interés en esta publicación?"
    )
    if (!ok) return

    const res = await fetch("/api/interest", {
      method: interested ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: data.id }),
      cache: "no-store",
    })

    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      if (res.status === 401) alert("Debes iniciar sesión.")
      else if (j?.error === "DUPLICATE") alert("Ya manifestaste interés.")
      else if (j?.error === "INACTIVE") alert("Publicación no activa.")
      else alert("No se pudo procesar la acción.")
      return
    }

    setInterested((p) => !p)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border p-6">Cargando detalle...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border p-6 space-y-4">
          <p className="font-medium">No se encontró la oportunidad.</p>
          <Link href="/dashboard/student/opportunities" className="inline-flex items-center gap-2 underline">
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Link>
        </div>
      </div>
    )
  }

  const isActive = data.lifecycle_status === "ACTIVE"

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/dashboard/student/opportunities" className="inline-flex items-center gap-2 underline">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="flex items-center gap-2">
          {/* ⭐ BOOKMARK = INTERÉS */}
          {interestLoading ? (
            <Button variant="ghost" size="icon" disabled className="text-muted-foreground opacity-60" type="button">
              <Bookmark className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleInterest}
              disabled={!isActive}
              className={interested ? "text-accent" : "text-muted-foreground"}
              type="button"
              title={interested ? "Retirar interés" : "Manifestar interés"}
            >
              <Bookmark className={`h-4 w-4 ${interested ? "fill-current" : ""}`} />
              <span className="sr-only">{interested ? "Retirar interés" : "Manifestar interés"}</span>
            </Button>
          )}

          {data.flyerUrl ? (
            <a
              href={data.flyerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <Download className="h-4 w-4" />
              Descargar flyer
            </a>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{data.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Empresa: {data.company ?? "No especificada"} · Estado: {data.lifecycle_status ?? "—"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <p className="text-sm font-medium">Modalidad</p>
            <p className="text-sm text-muted-foreground mt-1">{data.mode ?? "No especificada"}</p>
          </div>

          <div className="rounded-md border p-4">
            <p className="text-sm font-medium">Duración estimada</p>
            <p className="text-sm text-muted-foreground mt-1">{data.duration_estimated ?? "No especificada"}</p>
          </div>
        </div>

        <div className="rounded-md border p-4">
          <p className="text-sm font-medium">Descripción</p>
          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{data.description ?? ""}</p>
        </div>

        <div className="rounded-md border p-4">
          <p className="text-sm font-medium">Requisitos</p>
          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
            {data.requirements ?? "No especificados"}
          </p>
        </div>

        <div className="rounded-md border p-4">
          <p className="text-sm font-medium">Información de contacto</p>
          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
            {data.contact_info ?? "No especificada"}
          </p>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Clock, Bookmark, ExternalLink } from "lucide-react"

export interface Opportunity {
  id: string
  title: string
  company: string
  location: string
  type: "internship" | "graduation-project" | "job"
  description: string
  postedAt: string
  lifecycle_status?: string | null
}

interface OpportunityCardProps {
  opportunity: Opportunity
  isInterested: boolean
  onInterestToggle: (id: string, next: boolean) => void
}

/** Decide a qué detalle ir según tipo */
const getDetailPath = (oppId: string, type: Opportunity["type"]) => {
  // 👇 ajustá estos paths si tus rutas son distintas
  if (type === "job") return `/dashboard/graduate/opportunities/${oppId}`
  return `/dashboard/student/opportunities/${oppId}` // internship + graduation-project
}

export function OpportunityCard({
  opportunity,
  isInterested,
  onInterestToggle,
}: OpportunityCardProps) {
  const router = useRouter()

  // ✅ blindaje: evita /undefined
  const oppId = typeof opportunity?.id === "string" ? opportunity.id.trim() : ""
  const hasValidId = oppId.length > 0

  // Soporta "ACTIVE" y "ACTIVO"
  const isActive = ["ACTIVE", "ACTIVO"].includes(
    (opportunity.lifecycle_status ?? "").trim().toUpperCase()
  )

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!hasValidId) {
      console.warn("OpportunityCard: opportunity.id inválido:", opportunity)
      alert("No se puede procesar esta publicación (ID inválido).")
      return
    }

    if (!isActive) {
      alert("Esta publicación no está activa.")
      return
    }

    const ok = window.confirm(
      isInterested
        ? "¿Confirmas que deseas retirar tu manifestación de interés?"
        : "¿Confirmas que deseas manifestar interés en esta publicación?"
    )
    if (!ok) return

    onInterestToggle(oppId, !isInterested)
  }

  const goDetail = () => {
    if (!hasValidId) {
      console.warn("OpportunityCard: navigation blocked, id inválido:", opportunity)
      return
    }

    router.push(getDetailPath(oppId, opportunity.type))
  }

  const typeLabels: Record<string, string> = {
      internship: "Práctica",
      "graduation-project": "Trabajo de Fin de Grado",
      job: "Empleo"
    }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1 truncate">{opportunity.title}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {opportunity.company}
            </CardDescription>
          </div>

          {/* ⭐ BOOKMARK = INTERÉS */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={!isActive || !hasValidId}
            className={[
              "h-9 w-9",
              isInterested ? "text-accent" : "text-muted-foreground",
              !isActive || !hasValidId ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
            type="button"
            title={
              !hasValidId
                ? "Publicación inválida"
                : isActive
                ? isInterested
                  ? "Retirar interés"
                  : "Manifestar interés"
                : "Publicación no activa"
            }
          >
            <Bookmark className={`h-4 w-4 pointer-events-none ${isInterested ? "fill-current" : ""}`} />
            <span className="sr-only">{isInterested ? "Retirar interés" : "Manifestar interés"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{typeLabels[opportunity.type.toLowerCase()] || opportunity.type}</Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {opportunity.location}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {opportunity.postedAt}
          </div>
        </div>

        <p className="text-sm line-clamp-3">{opportunity.description}</p>
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          className="w-full bg-transparent"
          onClick={goDetail}
          disabled={!hasValidId}
          type="button"
          title={!hasValidId ? "No se puede abrir (ID inválido)" : "Ver detalles"}
        >
          Ver Detalles
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

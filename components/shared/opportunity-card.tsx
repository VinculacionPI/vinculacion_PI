"use client"

import { useRouter } from "next/navigation"
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

  // AHORA ES INTERÉS
  isInterested: boolean
  onInterestToggle: (id: string, next: boolean) => void
}

export function OpportunityCard({
  opportunity,
  isInterested,
  onInterestToggle,
}: OpportunityCardProps) {
  const router = useRouter()

  // ✅ no bloquea si no viene lifecycle_status
  const isActive = (opportunity.lifecycle_status ?? "ACTIVE").toUpperCase() === "ACTIVE"

  const handleToggle = (e: React.MouseEvent) => {
    // evita cualquier click bubbling raro
    e.preventDefault()
    e.stopPropagation()

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

    onInterestToggle(opportunity.id, !isInterested)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{opportunity.title}</CardTitle>
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
            disabled={!isActive}
            // ✅ área clickeable sólida + feedback visual
            className={[
              "h-9 w-9",
              isInterested ? "text-accent" : "text-muted-foreground",
              !isActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
            type="button"
            title={isActive ? (isInterested ? "Retirar interés" : "Manifestar interés") : "Publicación no activa"}
          >
            {/* ✅ el SVG no debe capturar clicks */}
            <Bookmark className={`h-4 w-4 pointer-events-none ${isInterested ? "fill-current" : ""}`} />
            <span className="sr-only">
              {isInterested ? "Retirar interés" : "Manifestar interés"}
            </span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{opportunity.type}</Badge>
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
          onClick={() => router.push(`/dashboard/student/opportunities/${opportunity.id}`)}
          type="button"
        >
          Ver Detalles
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

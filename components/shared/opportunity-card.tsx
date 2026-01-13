"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Clock, Bookmark, ExternalLink } from "lucide-react"

export type OpportunityType = "internship" | "graduation-project" | "job"

export interface Opportunity {
  id: string
  title: string
  company: string
  location: string
  type: OpportunityType
  description: string
  postedAt: string
  salary?: string
  requirements?: string[]
}

interface OpportunityCardProps {
  opportunity: Opportunity
  onFavorite?: (id: string) => void
  isFavorite?: boolean
}

const typeLabels: Record<OpportunityType, string> = {
  internship: "Práctica",
  "graduation-project": "Proyecto Graduación",
  job: "Empleo",
}

const typeColors: Record<OpportunityType, string> = {
  internship: "bg-chart-2 text-chart-2 text-white",
  "graduation-project": "bg-chart-3 text-chart-3 text-white",
  job: "bg-primary text-primary text-white",
}

export function OpportunityCard({ opportunity, onFavorite, isFavorite = false }: OpportunityCardProps) {
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
          {onFavorite && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onFavorite(opportunity.id)}
              className={isFavorite ? "text-accent" : "text-muted-foreground"}
            >
              <Bookmark className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
              <span className="sr-only">{isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={typeColors[opportunity.type]}>
            {typeLabels[opportunity.type]}
          </Badge>
          {opportunity.salary && <Badge variant="outline">{opportunity.salary}</Badge>}
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

        <p className="text-sm text-foreground line-clamp-3">{opportunity.description}</p>
      </CardContent>
      <CardFooter>
        <Link href={`/opportunities/${opportunity.id}`} className="w-full">
          <Button variant="outline" className="w-full bg-transparent">
            Ver Detalles
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

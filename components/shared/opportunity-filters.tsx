"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, X } from "lucide-react"

export interface OpportunityFilters {
  search: string
  types: string[]
  locations: string[]
  modalities?: string[]
}

interface OpportunityFiltersProps {
  onFilterChange: (filters: OpportunityFilters) => void
  initialFilters?: OpportunityFilters
}

export function OpportunityFiltersComponent({ onFilterChange, initialFilters }: OpportunityFiltersProps) {
  const [filters, setFilters] = useState<OpportunityFilters>(
    initialFilters || {
      search: "",
      types: [],
      locations: [],
      modalities: [],
    },
  )

  const handleSearchChange = (search: string) => {
    const newFilters = { ...filters, search }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleTypeToggle = (type: string) => {
    const types = filters.types.includes(type) ? filters.types.filter((t) => t !== type) : [...filters.types, type]
    const newFilters = { ...filters, types }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleLocationToggle = (location: string) => {
    const locations = filters.locations.includes(location)
      ? filters.locations.filter((l) => l !== location)
      : [...filters.locations, location]
    const newFilters = { ...filters, locations }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleModalityToggle = (modality: string) => {
    const modalities = (filters.modalities || []).includes(modality)
      ? (filters.modalities || []).filter((m) => m !== modality)
      : [...(filters.modalities || []), modality]
    const newFilters = { ...filters, modalities }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const newFilters = { search: "", types: [], locations: [], modalities: [] }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const hasActiveFilters = filters.search || filters.types.length > 0 || filters.locations.length > 0 || (filters.modalities || []).length > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Filtros</CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Título, empresa, palabras clave..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Tipo de Oportunidad</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="type-internship"
                checked={filters.types.includes("internship")}
                onCheckedChange={() => handleTypeToggle("internship")}
              />
              <Label htmlFor="type-internship" className="text-sm font-normal cursor-pointer">
                Práctica Profesional
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="type-graduation"
                checked={filters.types.includes("graduation-project")}
                onCheckedChange={() => handleTypeToggle("graduation-project")}
              />
              <Label htmlFor="type-graduation" className="text-sm font-normal cursor-pointer">
                Proyecto de Graduación
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="type-job"
                checked={filters.types.includes("job")}
                onCheckedChange={() => handleTypeToggle("job")}
              />
              <Label htmlFor="type-job" className="text-sm font-normal cursor-pointer">
                Empleo
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Modalidad</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mod-presencial"
                checked={(filters.modalities || []).includes("PRESENCIAL")}
                onCheckedChange={() => handleModalityToggle("PRESENCIAL")}
              />
              <Label htmlFor="mod-presencial" className="text-sm font-normal cursor-pointer">
                Presencial
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mod-hibrido"
                checked={(filters.modalities || []).includes("HÍBRIDO")}
                onCheckedChange={() => handleModalityToggle("HÍBRIDO")}
              />
              <Label htmlFor="mod-hibrido" className="text-sm font-normal cursor-pointer">
                Híbrido
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mod-remoto"
                checked={(filters.modalities || []).includes("REMOTO")}
                onCheckedChange={() => handleModalityToggle("REMOTO")}
              />
              <Label htmlFor="mod-remoto" className="text-sm font-normal cursor-pointer">
                Remoto
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Ubicación</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="loc-san-jose"
                checked={filters.locations.includes("San José")}
                onCheckedChange={() => handleLocationToggle("San José")}
              />
              <Label htmlFor="loc-san-jose" className="text-sm font-normal cursor-pointer">
                San José
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="loc-cartago"
                checked={filters.locations.includes("Cartago")}
                onCheckedChange={() => handleLocationToggle("Cartago")}
              />
              <Label htmlFor="loc-cartago" className="text-sm font-normal cursor-pointer">
                Cartago
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="loc-heredia"
                checked={filters.locations.includes("Heredia")}
                onCheckedChange={() => handleLocationToggle("Heredia")}
              />
              <Label htmlFor="loc-heredia" className="text-sm font-normal cursor-pointer">
                Heredia
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
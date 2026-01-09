"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Plus, X } from "lucide-react"
import type { OpportunityType } from "@/lib/types"

interface OpportunityFormProps {
  initialData?: {
    id?: string
    title: string
    description: string
    type: string
    location: string
    salary?: string
    requirements?: string[]
  }
  isEdit?: boolean
}

export function OpportunityForm({ initialData, isEdit = false }: OpportunityFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    type: (initialData?.type as OpportunityType) || "job",
    location: initialData?.location || "",
    salary: initialData?.salary || "",
    requirements: initialData?.requirements || [""],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const url = isEdit ? `/api/company/opportunities/${initialData?.id}` : "/api/company/opportunities"
      const method = isEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          requirements: formData.requirements.filter((req) => req.trim() !== ""),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al guardar la oportunidad")
      }

      router.push("/dashboard/company")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, ""],
    })
  }

  const removeRequirement = (index: number) => {
    const newRequirements = formData.requirements.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      requirements: newRequirements.length > 0 ? newRequirements : [""],
    })
  }

  const updateRequirement = (index: number, value: string) => {
    const newRequirements = [...formData.requirements]
    newRequirements[index] = value
    setFormData({ ...formData, requirements: newRequirements })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Editar Información" : "Detalles de la Oportunidad"}</CardTitle>
        <CardDescription>
          {isEdit ? "Actualiza la información de tu oportunidad" : "Todos los campos son requeridos excepto el salario"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título de la Oportunidad *</Label>
            <Input
              id="title"
              placeholder="ej: Desarrollador Full Stack"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Oportunidad *</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as OpportunityType })}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="internship" id="internship" className="peer sr-only" />
                <Label
                  htmlFor="internship"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-sm font-medium">Práctica</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="graduation-project" id="graduation-project" className="peer sr-only" />
                <Label
                  htmlFor="graduation-project"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-sm font-medium">Proyecto</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="job" id="job" className="peer sr-only" />
                <Label
                  htmlFor="job"
                  className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-sm font-medium">Empleo</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ubicación *</Label>
            <Input
              id="location"
              placeholder="ej: San José, Cartago, Remoto"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Salario (Opcional)</Label>
            <Input
              id="salary"
              placeholder="ej: ₡1,200,000 - ₡1,800,000"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              placeholder="Describe la oportunidad, responsabilidades, beneficios, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={isLoading}
              rows={6}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Requisitos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRequirement} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Requisito ${index + 1}`}
                    value={req}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    disabled={isLoading}
                  />
                  {formData.requirements.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRequirement(index)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Actualizando..." : "Publicando..."}
                </>
              ) : isEdit ? (
                "Actualizar Oportunidad"
              ) : (
                "Publicar Oportunidad"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/company")}
              disabled={isLoading}
              className="bg-transparent"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

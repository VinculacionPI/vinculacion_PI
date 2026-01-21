"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2 } from "lucide-react"

export type OpportunityType = "TFG" | "PASANTIA" | "EMPLEO"
export type Mode = "PRESENCIAL" | "VIRTUAL" | "HÍBRIDO"

export interface OpportunityFormData {
  id?: string
  company_id?: string // <- para pruebas
  title: string
  description: string
  type: OpportunityType
  mode: Mode
  duration_estimated: string
  requirements: string
  contact_info: string
}

interface OpportunityFormProps {
  initialData?: OpportunityFormData
  isEdit?: boolean
}

export function OpportunityForm({ initialData, isEdit = false }: OpportunityFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState<OpportunityFormData>({
    id: initialData?.id,
    company_id: initialData?.company_id ?? "caa6a12e-b110-4616-b786-7f18fea2b443",
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    type: initialData?.type ?? "TFG",
    mode: initialData?.mode ?? "HÍBRIDO",
    duration_estimated: initialData?.duration_estimated ?? "",
    requirements: initialData?.requirements ?? "",
    contact_info: initialData?.contact_info ?? "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.description.trim().length < 100) {
      setError("La descripción debe tener al menos 100 caracteres.")
      return
    }

    if (isEdit && !formData.id) {
      setError("No se pudo actualizar: falta el ID de la oportunidad.")
      return
    }

    setIsLoading(true)

    try {
      const url = isEdit ? `/api/company/opportunities/${formData.id}` : "/api/company/opportunities"
      const method: "POST" | "PUT" = isEdit ? "PUT" : "POST"

      const payload = {
        ...formData,
        // Asegurar strings limpios
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration_estimated: formData.duration_estimated.trim(),
        requirements: formData.requirements.trim(),
        contact_info: formData.contact_info.trim(),
      }

      console.log("EDIT?", isEdit)
      console.log("URL:", url)
      console.log("METHOD:", method)

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      let data: any = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = { raw: text }
      }

      if (!res.ok) {
        console.log("API status:", res.status)
        console.log("API body:", data)
        throw new Error(data.error || data.message || `Error ${res.status}`)
      }

      router.push("/dashboard/company")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Editar Oportunidad" : "Nueva Oportunidad"}</CardTitle>
        <CardDescription>Todos los campos son obligatorios</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label>Tipo *</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(v) => setFormData({ ...formData, type: v as OpportunityType })}
              className="flex gap-6"
            >
              {["TFG", "PASANTIA", "EMPLEO"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <RadioGroupItem value={t} id={t} disabled={isLoading} />
                  <Label htmlFor={t}>{t}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Descripción *</Label>
            <Textarea
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">{formData.description.trim().length} / 100 caracteres</p>
          </div>

          <div>
            <Label>Modalidad *</Label>
            <RadioGroup
              value={formData.mode}
              onValueChange={(v) => setFormData({ ...formData, mode: v as Mode })}
              className="flex gap-6"
            >
              {["PRESENCIAL", "VIRTUAL", "HÍBRIDO"].map((m) => (
                <div key={m} className="flex items-center gap-2">
                  <RadioGroupItem value={m} id={m} disabled={isLoading} />
                  <Label htmlFor={m}>{m}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Duración estimada *</Label>
            <Input
              value={formData.duration_estimated}
              onChange={(e) => setFormData({ ...formData, duration_estimated: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label>Requisitos *</Label>
            <Textarea
              rows={4}
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label>Contacto *</Label>
            <Input
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : isEdit ? (
              "Actualizar Oportunidad"
            ) : (
              "Publicar Oportunidad"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

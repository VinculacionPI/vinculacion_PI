"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Plus, X, FileText } from "lucide-react"
import { UploadFlyer } from "@/components/company/upload-flyer"
import { generarFlyer } from "@/lib/services/api"
import type { OpportunityType } from "@/lib/types"
import { getCurrentCompanyId } from '@/lib/auth/get-current-user'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OpportunityFormProps {
  initialData?: {
    id?: string
    title: string
    description: string
    type: string
    area?: string
    mode?: string
    salary?: string
    duration?: string
    schedule?: string
    contractType?: string
    benefits?: string
    startDate?: string
    contactInfo?: string
    requirements?: string[]
  }
  isEdit?: boolean
}

function parseSalaryRange(value: string): { min: number; max: number } {
  const parts = value
    .split("-")
    .map(v => parseFloat(v.replace(/[^\d.]/g, "")))
    .filter(v => !isNaN(v));

  return {
    min: parts[0] ?? 0,
    max: parts[1] ?? parts[0] ?? 0,
  };
}

export function OpportunityForm({ initialData, isEdit = false }: OpportunityFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showFlyerStep, setShowFlyerStep] = useState(false)
  const [createdOpportunityId, setCreatedOpportunityId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    type: (initialData?.type as OpportunityType) || "job",
    mode: "virtual",
    duration: "6 meses",
    schedule: "",
    contractType: "",
    salary: initialData?.salary || "",
    benefits: "",
    startDate: "",
    area: initialData?.area || "",
    contactInfo: "",
    requirements: initialData?.requirements || [""],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const empresaId = await getCurrentCompanyId()

      const tipoMapeado =
        formData.type === 'internship' ? 'INTERNSHIP' :
        formData.type === 'graduation-project' ? 'TFG' :
        'JOB'

      // Payload general
      const payload = {
        i_id: isEdit ? initialData?.id ?? null : null, 
        i_title: formData.title,
        i_type: tipoMapeado,
        i_description: formData.description,
        i_mode: formData.mode,
        i_area: formData.area,
        i_requirements: formData.requirements.filter(r => r.trim()).join('\n') || 'No especificados',
        i_contact: formData.contactInfo,
        i_duration: formData.duration,
        i_schedule: formData.schedule,
        i_remuneration: formData.salary ? parseFloat(formData.salary.replace(/[^\d.-]/g, '')) : null,
        i_company_id: empresaId,
        i_flyer_url: null,
      }

      let data
      if (formData.type === "internship") {
        // Llamada al endpoint de internships
        const response = await fetch("/api/opportunities/internship", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || "Error creando la oportunidad")
        }

        data = await response.json()
      } 
      else if (formData.type === "graduation-project") {
        // Llamada al endpoint de TFG
        const response = await fetch("/api/opportunities/tfg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || "Error creando el TFG")
        }

        data = await response.json()
      } 
      else {
        // JOB
        const { min, max } = parseSalaryRange(formData.salary);

        const jobPayload = {
          j_id: isEdit ? initialData?.id ?? null : null,
          j_title: formData.title,
          j_type: 'JOB',
          j_description: formData.description,
          j_mode: formData.mode,
          j_area: formData.area,
          j_requirements: formData.requirements.filter(r => r.trim()).join('\n') || 'No especificados',
          j_contact_info: formData.contactInfo,
          j_contract_type: formData.contractType,
          j_salary_min: min,
          j_salary_max: max,
          j_benefits: formData.benefits,
          j_estimated_start_date: formData.startDate,
          j_company_id: empresaId,
          j_flyer_url: null,
        };


        const response = await fetch("/api/opportunities/job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobPayload),
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || "Error creando el trabajo")
        }

        data = await response.json()
      }

      if (isEdit) {
        router.push("/dashboard/company")
        return
      }

      setCreatedOpportunityId(data.opportunity_id)
      setShowFlyerStep(true)

    } catch (err: any) {
      console.error("Error completo:", err)
      setError(err?.message || "Ocurrió un error")
      setIsLoading(false)
    }
  }


  const handleGenerateFlyer = async () => {
    if (!createdOpportunityId) return
    
    setIsLoading(true)
    try {
      console.log('Generando flyer para:', createdOpportunityId)
      const result = await generarFlyer(createdOpportunityId)
      
      console.log('Resultado completo:', result)
      
      if ((result as any)?.success && (result as any)?.data?.html) {
        // Guardar el flyer URL en la base de datos
        const flyerUrl = `data:text/html;base64,${btoa((result as any).data.html)}`
        
        const saveResponse = await fetch(`/api/opportunities/${createdOpportunityId}/flyer`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flyer_url: flyerUrl }),
        })

        if (!saveResponse.ok) {
          throw new Error('Error guardando el flyer')
        }

        console.log('Flyer guardado exitosamente')

        // Abrir en nueva ventana
        const win = window.open('', '_blank')
        if (win) {
          win.document.open()
          win.document.write((result as any).data.html)
          win.document.close()
        } else {
          console.warn('No se pudo abrir la ventana del flyer')
        }

        // Redirigir después de 2 segundos
        setTimeout(() => router.push("/dashboard/company"), 2000)
      } else {
        console.error('Error en respuesta:', result)
        throw new Error((result as any)?.error || 'No hay HTML')
      }
    } catch (err: any) {
      console.error('Exception:', err)
      setError(`Error generando flyer: ${err.message}`)
      setIsLoading(false)
    }
  }

  const handleSkipFlyer = async () => {
    router.push("/dashboard/company")
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

  useEffect(() => {
      if (isEdit && initialData) {
        setFormData((prev) => ({
          ...prev,
          title: initialData.title ?? "",
          description: initialData.description ?? "",
          type: initialData.type as OpportunityType,
          area: initialData.area ?? "",
          mode: initialData.mode ?? "virtual",
          salary: initialData.salary ?? "",
          duration: initialData.duration ?? "",
          schedule: initialData.schedule ?? "",
          contractType: initialData.contractType ?? "",
          benefits: initialData.benefits ?? "",
          startDate: initialData.startDate ?? "",
          contactInfo: initialData.contactInfo ?? "",
          requirements: initialData.requirements?.length
            ? initialData.requirements
            : [""],
        }))
      }
    }, [isEdit, initialData])

  // Mostrar paso de flyer después de crear
  if (showFlyerStep && createdOpportunityId) {
    return (
      <div className="space-y-6">
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">
              Oportunidad Creada Exitosamente
            </CardTitle>
            <CardDescription>
              Elige UNA opción para el flyer de tu oportunidad
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>¿Cómo deseas crear el flyer?</CardTitle>
            <CardDescription>
              Selecciona una de las siguientes opciones. Podrás cambiarlo después.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center gap-3 hover:border-primary"
                onClick={handleGenerateFlyer}
                disabled={isLoading}
              >
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="font-semibold">Generar Automáticamente</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Flyer profesional con datos de la oportunidad
                  </p>
                </div>
              </Button>

              <div>
                <UploadFlyer
                  opportunityId={createdOpportunityId}
                  onUploadSuccess={() => {
                    setTimeout(() => router.push("/dashboard/company"), 1000)
                  }}
                  compact={true}
                />
              </div>
            </div>

            <div className="text-center pt-4 border-t">
              <Button variant="ghost" onClick={handleSkipFlyer}>
                Omitir y continuar sin flyer
              </Button>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Formulario normal
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
            <Label htmlFor="area">Área *</Label>
            <Input
              id="area"
              placeholder="ej: Ingeniería, Marketing, Ventas"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Oportunidad *</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as OpportunityType })}
              className={`grid grid-cols-3 gap-4 ${
                isEdit ? "opacity-50 pointer-events-none" : ""
              }`}
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
            <Label htmlFor="mode">Modalidad *</Label>
            <Select 
              value={formData.mode} 
              onValueChange={(value) => setFormData({ ...formData, mode: value })}
              disabled={isLoading}
            >
              <SelectTrigger id="mode">
                <SelectValue placeholder="Selecciona modalidad" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5} className="z-50">
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="hibrida">Híbrida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.type === 'graduation-project') && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duración Estimada *</Label>
              <Input
                id="duration"
                placeholder="ej: 6 meses, 1 año"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          )}

          {(formData.type === "internship" || formData.type === "graduation-project") && (
            <div className="space-y-2">
              <Label htmlFor="schedule">Horario *</Label>
              <Input
                id="schedule"
                placeholder="ej: Lunes a Viernes, 8am - 4pm"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                required
                disabled={isLoading}
              />

              <Label htmlFor="salary">Remuneración (Opcional)</Label>
              <Input
                id="salary"
                placeholder="ej: ₡500,000 - ₡700,000"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                disabled={isLoading}
              />
            </div>
          )}

          {formData.type === "job" && (
            <div className="space-y-2">
              <Label htmlFor="contractType">Tipo de contrato *</Label>
              <Input
                id="contractType"
                placeholder="ej: Tiempo completo, Medio tiempo"
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                required
                disabled={isLoading}
              />

              <Label htmlFor="salary">Rango salarial *</Label>
              <Input
                id="salary"
                placeholder="ej: ₡1,200,000 - ₡1,800,000"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                required
                disabled={isLoading}
              />

              <Label htmlFor="benefits">Beneficios</Label>
              <Textarea
                id="benefits"
                placeholder="ej: Seguro, Vacaciones, Bonos"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                disabled={isLoading}
                rows={3}
              />

              <Label htmlFor="startDate">Fecha estimada de inicio *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="contactInfo">Información de Contacto *</Label>
            <Input
              id="contactInfo"
              type="email"
              placeholder="correo@empresa.com"
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              required
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
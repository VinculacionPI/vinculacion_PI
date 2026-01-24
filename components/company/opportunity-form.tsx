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
import { Loader2, Plus, X, FileText, Upload } from "lucide-react"
import { UploadFlyer } from "@/components/company/upload-flyer"
import { generarFlyer } from "@/lib/services/persona5-backend"
import { supabase } from "@/lib/supabase"
import type { OpportunityType } from "@/lib/types"
import { getCurrentCompanyId } from '@/lib/auth/get-current-user'

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
  const [showFlyerStep, setShowFlyerStep] = useState(false)
  const [createdOpportunityId, setCreatedOpportunityId] = useState<string | null>(null)
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
      // Mapear tipo del frontend al backend
      const tipoMapeado = 
        formData.type === 'internship' ? 'PASANTIA' :
        formData.type === 'graduation-project' ? 'TFG' : 'EMPLEO'

        if (isEdit && initialData?.id) {
          // Preparar datos base
          const updateData: any = {
            title: formData.title,
            description: formData.description,
            type: tipoMapeado,
            mode: formData.location && ['presencial', 'virtual', 'hibrida'].includes(formData.location.toLowerCase()) 
              ? formData.location.toLowerCase() 
              : 'virtual',
          }

          // Agregar requirements si hay
          const reqs = formData.requirements.filter(r => r.trim()).join('\n')
          if (reqs) {
            updateData.requirements = reqs
          }

          // Si es TFG, agregar campos requeridos por el constraint
          if (tipoMapeado === 'TFG') {
            // Solo agregar si no existen ya en la BD
            const { data: existing } = await supabase
              .from('OPPORTUNITY')
              .select('duration_estimated, contact_info')
              .eq('id', initialData.id)
              .single()

            updateData.duration_estimated = existing?.duration_estimated || '6 meses'
            updateData.contact_info = existing?.contact_info || 'vinculacion@tec.ac.cr'
            
            // Asegurar que description tenga al menos 100 caracteres
            if (updateData.description.length < 100) {
              updateData.description = updateData.description.padEnd(100, ' - Información adicional pendiente.')
            }
          }

          const { error: updateError } = await supabase
            .from('OPPORTUNITY')
            .update(updateData)
            .eq('id', initialData.id)

          if (updateError) throw updateError
          router.push("/dashboard/company")
        
      } else {
        // Crear nueva oportunidad usando fetch directo
        const empresaId = await getCurrentCompanyId()

        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/OPPORTUNITY`, {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            type: tipoMapeado,
            mode: formData.location,
            requirements: formData.requirements.filter(r => r.trim()).join('\n'),
            company_id: empresaId,
            status: 'OPEN',
            approval_status: 'PENDING',
            lifecycle_status: 'ACTIVE',
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Error creando oportunidad')
        }

        const data = await response.json()
        const createdOpp = Array.isArray(data) ? data[0] : data

        // Mostrar paso de flyer
        setCreatedOpportunityId(createdOpp.id)
        setShowFlyerStep(true)
      }
      } catch (err: any) {
      console.error('Error completo:', err)
      const errorMsg = err?.message || err?.error_description || err?.msg || JSON.stringify(err)
      setError(errorMsg)
    } finally {
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
      console.log('HTML recibido:', result.data?.html?.substring(0, 200))
      
      if (result.success && result.data?.html) {
        // Abrir en nueva ventana y escribir directamente
        const win = window.open('', '_blank')
        if (win) {
          win.document.open()
          win.document.write(result.data.html)
          win.document.close()
        } else {
          alert('No se pudo abrir la ventana. Verifica que no esté bloqueada por el navegador.')
        }
      } else {
        console.error('Error en respuesta:', result)
        alert('Error generando flyer: ' + (result.error || 'No hay HTML'))
      }
    } catch (err) {
      console.error('Exception:', err)
      alert('Error generando flyer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipFlyer = () => {
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

  // Mostrar paso de flyer después de crear
  if (showFlyerStep && createdOpportunityId) {
    return (
      <div className="space-y-6">
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400">
              ✓ Oportunidad Creada Exitosamente
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
              {/* Generar automáticamente */}
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center gap-3 hover:border-primary"
                onClick={() => {
                  handleGenerateFlyer()
                  setTimeout(() => router.push("/dashboard/company"), 2000)
                }}
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

              {/* Subir personalizado */}
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
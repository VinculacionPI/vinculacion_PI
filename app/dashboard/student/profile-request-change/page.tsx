"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle, ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const FIELD_OPTIONS = [
  { value: "name", label: "Nombre Completo" },
  { value: "cedula", label: "Número de Cédula" },
  { value: "carnet", label: "Número de Carné" },
  { value: "email", label: "Correo Institucional" },
  { value: "address", label: "Dirección" },
  { value: "semester", label: "Semestre" }
]

export default function RequestChangePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    field: "",
    currentValue: "",
    newValue: "",
    reason: "",
    supportingDocument: null as File | null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No hay sesión activa")

      // Validaciones básicas
      if (!formData.field || !formData.newValue || !formData.reason) {
        throw new Error("Todos los campos son obligatorios")
      }
      
      // Crear solicitud de cambio
      const changeRequest = {
        user_id: session.user.id,
        field: formData.field,
        current_value: formData.currentValue,
        new_value: formData.newValue,
        reason: formData.reason,
        status: "pending",
        created_at: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from("change_requests")
        .insert([changeRequest])

      if (insertError) throw insertError

      // Registrar auditoría
      await supabase
        .from("audit_logs")
        .insert([{
          user_id: session.user.id,
          operation_type: "change_request",
          ip_address: "client-side",
          details: `Solicitud de cambio de ${FIELD_OPTIONS.find(f => f.value === formData.field)?.label}`,
          metadata: {
            field: formData.field,
            new_value: formData.newValue,
            reason: formData.reason
          }
        }])

      setSuccess("Solicitud enviada exitosamente. Será revisada por el administrador.")
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push("/dashboard/student/profile")
      }, 3000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/student/profile" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al Perfil
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Solicitar Cambio Administrativo</h1>
        <p className="text-gray-600 mt-2">
          Para modificar datos no editables, complete este formulario para revisión administrativa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulario de Solicitud</CardTitle>
          <CardDescription>
            Complete todos los campos. La solicitud será revisada en un plazo de 3-5 días hábiles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="field">Campo a Modificar *</Label>
              <Select
                value={formData.field}
                onValueChange={(value) => setFormData({...formData, field: value})}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el campo" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Valor Actual *</Label>
              <Input
                id="currentValue"
                value={formData.currentValue}
                onChange={(e) => setFormData({...formData, currentValue: e.target.value})}
                placeholder="Ingrese el valor actual del campo"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newValue">Nuevo Valor *</Label>
              <Input
                id="newValue"
                value={formData.newValue}
                onChange={(e) => setFormData({...formData, newValue: e.target.value})}
                placeholder="Ingrese el nuevo valor deseado"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo del Cambio *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Explique detalladamente por qué necesita este cambio"
                disabled={loading}
                required
                rows={4}
              />
              <p className="text-xs text-gray-500">
                Incluya cualquier información relevante o documentación de respaldo.
              </p>
            </div>

            {/* Mensajes de éxito/error */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-green-700 font-medium">{success}</p>
                  <p className="text-green-600 text-sm">Redirigiendo al perfil...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/student/profile")}
                disabled={loading}
              >
                Cancelar
              </Button>
              
              <Button type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
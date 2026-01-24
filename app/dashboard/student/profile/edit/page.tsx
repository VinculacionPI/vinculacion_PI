"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Mail, Phone, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    personalEmail: "",
    phone: "",
  })

  const [originalData, setOriginalData] = useState({
    name: "",
    email: "",
    cedula: "",
    carnet: "",
    address: "",
    semester: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase
        .from("USERS")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (error) throw error
      
      setFormData({
        personalEmail: data.personalEmail || "",
        phone: data.phone || "",
      })

      setOriginalData({
        name: data.name,
        email: data.email,
        cedula: data.cedula,
        carnet: data.carnet,
        address: data.address,
        semester: data.semester,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No hay sesión activa")

      // Validar teléfono
      const phoneRegex = /^\d{8}$/
      if (!phoneRegex.test(formData.phone)) {
        throw new Error("El teléfono debe tener 8 dígitos")
      }

      // Validar email personal si está presente
      if (formData.personalEmail && !formData.personalEmail.includes("@")) {
        throw new Error("Correo personal inválido")
      }

      // Actualizar datos editables
      const updateData: any = {
        phone: formData.phone,
        updated_at: new Date().toISOString()
      }

      if (formData.personalEmail.trim()) {
        updateData.personalEmail = formData.personalEmail.toLowerCase()
      } else {
        updateData.personalEmail = null
      }

      const { error: updateError } = await supabase
        .from("USERS")
        .update(updateData)
        .eq("id", session.user.id)

      if (updateError) throw updateError

      // Registrar auditoría
      await supabase
        .from("audit_logs")
        .insert([{
          user_id: session.user.id,
          operation_type: "profile_update",
          ip_address: "client-side",
          details: "Actualización de datos personales",
          metadata: {
            updated_fields: Object.keys(updateData).filter(k => k !== 'updated_at'),
          },
          created_at: new Date().toISOString()
        }])

      setSuccess("Perfil actualizado exitosamente")
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push("/dashboard/student/profile")
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Cargando...</div>

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/student/profile" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al Perfil
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Editar Perfil</h1>
        <p className="text-gray-600 mt-2">
          Actualiza tu información personal. Solo algunos campos son editables.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos Personales</CardTitle>
          <CardDescription>
            Campos marcados con * son obligatorios. Los campos no editables requieren solicitud administrativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campos NO editables - Solo lectura */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Institucional (No Editable)
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input value={originalData.name} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">
                    Para cambios, solicite al administrador
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Cédula</Label>
                  <Input value={originalData.cedula} disabled className="bg-gray-50" />
                </div>

                <div className="space-y-2">
                  <Label>Carné</Label>
                  <Input value={originalData.carnet} disabled className="bg-gray-50" />
                </div>

                <div className="space-y-2">
                  <Label>Correo Institucional</Label>
                  <Input value={originalData.email} disabled className="bg-gray-50" />
                </div>

                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input value={originalData.address} disabled className="bg-gray-50" />
                </div>

                <div className="space-y-2">
                  <Label>Semestre</Label>
                  <Input value={`Semestre ${originalData.semester}`} disabled className="bg-gray-50" />
                </div>
              </div>
            </div>

            {/* Campos editables */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Información Editable
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="personalEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Correo Personal Alternativo
                  </Label>
                  <Input
                    id="personalEmail"
                    type="email"
                    placeholder="personal@email.com"
                    value={formData.personalEmail}
                    onChange={(e) => setFormData({...formData, personalEmail: e.target.value})}
                    disabled={saving}
                  />
                  <p className="text-xs text-gray-500">
                    Opcional. Para contacto alternativo.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Número de Teléfono *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="88888888"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={saving}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    8 dígitos sin guiones
                  </p>
                </div>
              </div>
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

            {/* Botones */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/student/profile")}
                disabled={saving}
              >
                Cancelar
              </Button>
              
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Solicitud para cambios no editables */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>¿Necesitas cambiar datos no editables?</CardTitle>
          <CardDescription>
            Si necesitas actualizar tu nombre, cédula, carné o correo institucional, debes solicitarlo formalmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/student/profile/request-change">
              Solicitar Cambio Administrativo
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
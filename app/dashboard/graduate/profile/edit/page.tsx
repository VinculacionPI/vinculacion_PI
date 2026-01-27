"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Mail, Phone, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function EditGraduateProfilePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    personalEmail: "",
    phone: "",
  })

  // guarda valores originales para comparar cambios
  const [originalEditable, setOriginalEditable] = useState({
    personalEmail: "",
    phone: "",
  })

  const [originalData, setOriginalData] = useState({
    name: "",
    email: "",
    cedula: "",
    carnet: "",
    address: "",
    graduation_year: "",
    degree_title: "",
    major: "",
    thesis_title: "",
    final_gpa: "",
  })

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("/api/profile")
      
      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login")
          return
        }
        throw new Error("Error al cargar perfil")
      }

      const data = await response.json()

      const personalEmail = data.personalEmail ?? ""
      const phone = data.phone ?? ""

      setFormData({ personalEmail, phone })
      setOriginalEditable({ personalEmail, phone })

      setOriginalData({
        name: data.name ?? "",
        email: data.email ?? "",
        cedula: data.cedula ?? "",
        carnet: data.carnet ?? "",
        address: data.address ?? "",
        graduation_year: data.graduation_year ? String(data.graduation_year) : "",
        degree_title: data.degree_title ?? "",
        major: data.major ?? "",
        thesis_title: data.thesis_title ?? "",
        final_gpa: data.final_gpa ? String(data.final_gpa) : "",
      })
    } catch (err: any) {
      setError(err?.message ?? "Error cargando perfil")
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
      // Validaciones
      const phoneTrim = (formData.phone ?? "").trim()
      const phoneRegex = /^\d{8}$/
      if (!phoneRegex.test(phoneTrim)) {
        throw new Error("El teléfono debe tener 8 dígitos")
      }

      const personalTrim = (formData.personalEmail ?? "").trim()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (personalTrim && !emailRegex.test(personalTrim)) {
        throw new Error("Correo personal inválido")
      }

      // Comparar contra original
      const nextPersonal = personalTrim ? personalTrim.toLowerCase() : ""
      const nextPhone = phoneTrim

      const hasChanges =
        nextPhone !== (originalEditable.phone ?? "") ||
        nextPersonal !== (originalEditable.personalEmail ?? "")

      if (!hasChanges) {
        throw new Error("No se detectaron cambios para guardar")
      }

      // Update using API
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: originalData.name,
          cedula: originalData.cedula,
          phone: nextPhone,
          personalEmail: nextPersonal || null,
          carnet: originalData.carnet,
          address: originalData.address,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Error al actualizar perfil")
      }

      setSuccess("Perfil actualizado exitosamente")

      // actualizar originales
      setOriginalEditable({
        phone: nextPhone,
        personalEmail: nextPersonal,
      })

      setTimeout(() => {
        router.push("/dashboard/graduate/profile")
      }, 1200)
    } catch (err: any) {
      setError(err?.message ?? "Error guardando")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Cargando...</div>

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/graduate/profile" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al Perfil
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Editar Perfil</h1>
        <p className="text-gray-600 mt-2">Actualiza tu información personal. Solo algunos campos son editables.</p>
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
            {/* NO editables */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Institucional (No Editable)
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input value={originalData.name} disabled className="bg-gray-50" />
                  <p className="text-xs text-gray-500">Para cambios, solicite al administrador</p>
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

                {originalData.graduation_year && (
                  <div className="space-y-2">
                    <Label>Año de Graduación</Label>
                    <Input value={originalData.graduation_year} disabled className="bg-gray-50" />
                  </div>
                )}

                {originalData.degree_title && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Título del Grado</Label>
                    <Input value={originalData.degree_title} disabled className="bg-gray-50" />
                  </div>
                )}

                {originalData.major && (
                  <div className="space-y-2">
                    <Label>Major</Label>
                    <Input value={originalData.major} disabled className="bg-gray-50" />
                  </div>
                )}

                {originalData.final_gpa && (
                  <div className="space-y-2">
                    <Label>GPA Final</Label>
                    <Input value={originalData.final_gpa} disabled className="bg-gray-50" />
                  </div>
                )}

                {originalData.thesis_title && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Título de Tesis</Label>
                    <Input value={originalData.thesis_title} disabled className="bg-gray-50" />
                  </div>
                )}
              </div>
            </div>

            {/* Editables */}
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
                    onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                    disabled={saving}
                  />
                  <p className="text-xs text-gray-500">Opcional. Para contacto alternativo.</p>
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
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={saving}
                    required
                  />
                  <p className="text-xs text-gray-500">8 dígitos sin guiones</p>
                </div>
              </div>
            </div>

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-green-700 font-medium">{success}</p>
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
                onClick={() => router.push("/dashboard/graduate/profile")}
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>¿Necesitas cambiar datos no editables?</CardTitle>
          <CardDescription>
            Si necesitas actualizar tu nombre, cédula, carné, información de graduación o correo institucional, debes solicitarlo formalmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/graduate/profile/request-change">
              Solicitar Cambio Administrativo
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, Users, IdCard, Mail, Phone, MapPin, GraduationCap } from "lucide-react"

interface GraduateFormData {
  name: string
  email: string
  password: string
  confirmPassword: string

  cedula: string
  carnet: string
  phone: string
  address: string
  personalEmail: string

  graduation_year: string
  degree_title: string
  major: string
  thesis_title: string
  final_gpa: string
}

export function GraduateRegisterForm() {
  const router = useRouter()

  const [formData, setFormData] = useState<GraduateFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cedula: "",
    carnet: "",
    phone: "",
    address: "",
    personalEmail: "",
    graduation_year: "",
    degree_title: "",
    major: "",
    thesis_title: "",
    final_gpa: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session) router.push("/dashboard")
      } catch {
        // no-op
      }
    }
    checkSession()
  }, [router])

  const validate = () => {
    const errs: Record<string, string> = {}

    if (!formData.name.trim() || formData.name.trim().length < 3) errs.name = "Nombre mínimo 3 caracteres"
    if (!formData.email.includes("@")) errs.email = "Correo inválido"

    if (!/^\d{9}$/.test(formData.cedula)) errs.cedula = "Cédula debe tener 9 dígitos"
    if (!/^\d{7,10}$/.test(formData.carnet)) errs.carnet = "Carnet entre 7 y 10 dígitos"

    if (!/^[2-8]\d{7}$/.test(formData.phone)) errs.phone = "Teléfono inválido (8 dígitos)"
    if (!formData.address.trim()) errs.address = "Dirección requerida"

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(formData.password)) errs.password = "Min 8 chars con mayús, minús y número"
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = "No coinciden"

    const year = Number(formData.graduation_year)
    if (!year || year < 1950 || year > new Date().getFullYear() + 1) errs.graduation_year = "Año inválido"
    if (!formData.degree_title.trim()) errs.degree_title = "Título del grado requerido"

    if (formData.final_gpa.trim()) {
      const gpa = Number(formData.final_gpa)
      if (Number.isNaN(gpa) || gpa < 0 || gpa > 10) errs.final_gpa = "GPA inválido (0 a 10)"
    }

    setValidationErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (k: keyof GraduateFormData, v: string) => {
    setFormData((p) => ({ ...p, [k]: v }))
    if (validationErrors[k]) {
      setValidationErrors((prev) => {
        const copy = { ...prev }
        delete copy[k]
        return copy
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!validate()) return

    setIsLoading(true)

    try {
      const emailLower = formData.email.trim().toLowerCase()

      // 1) Crear usuario en Supabase Auth (esto genera el user_id)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailLower,
        password: formData.password,
        options: {
          data: {
            name: formData.name.trim(),
            role: "graduate",
            cedula: formData.cedula,
            carnet: formData.carnet,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        // Mensajes comunes más “humanos”
        if (authError.message.includes("already registered") || authError.code === "user_already_exists") {
          throw new Error("Este correo ya está registrado en el sistema")
        }
        if (authError.code === "weak_password" || authError.message.toLowerCase().includes("password")) {
          throw new Error("Contraseña débil. Use mínimo 8 caracteres con mayúsculas, minúsculas y números.")
        }
        throw new Error(authError.message)
      }

      if (!authData?.user?.id) {
        throw new Error("No se pudo crear el usuario (sin user_id). Intente nuevamente.")
      }

      const userId = authData.user.id

      // 2) Crear perfil + solicitud (USERS + graduation_requests) via tu API
      const res = await fetch("/api/auth/register/graduates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,

          name: formData.name.trim(),
          email: emailLower,
          personalEmail: formData.personalEmail.trim() ? formData.personalEmail.trim().toLowerCase() : null,

          cedula: formData.cedula,
          carnet: formData.carnet,
          phone: formData.phone,
          address: formData.address.trim(),

          graduation_year: Number(formData.graduation_year),
          degree_title: formData.degree_title.trim(),
          major: formData.major.trim() || null,
          thesis_title: formData.thesis_title.trim() || null,
          final_gpa: formData.final_gpa.trim() ? Number(formData.final_gpa) : null,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // Si el server te dice el porqué, lo mostramos
        throw new Error(data?.message || "No se pudo completar el registro")
      }

      setSuccess(true)

      setTimeout(() => {
        router.push("/login?pending=graduate&email=" + encodeURIComponent(emailLower))
      }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Users className="h-7 w-7" />
          Registro de Graduado
        </CardTitle>
        <CardDescription className="text-base">
          Tu cuenta quedará <strong>pendiente de aprobación</strong> por un administrador.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex gap-3">
              <AlertCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-green-700 text-sm">
                Solicitud enviada. Un administrador revisará tu información.
              </p>
            </div>
          )}

          {error && !success && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex gap-3">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Datos base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Información Personal</h3>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Nombre Completo *
              </Label>
              <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} disabled={isLoading} />
              {validationErrors.name && <p className="text-sm text-destructive">{validationErrors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <IdCard className="h-4 w-4" /> Cédula *
                </Label>
                <Input value={formData.cedula} onChange={(e) => handleChange("cedula", e.target.value)} disabled={isLoading} />
                {validationErrors.cedula && <p className="text-sm text-destructive">{validationErrors.cedula}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <IdCard className="h-4 w-4" /> Carnet *
                </Label>
                <Input value={formData.carnet} onChange={(e) => handleChange("carnet", e.target.value)} disabled={isLoading} />
                {validationErrors.carnet && <p className="text-sm text-destructive">{validationErrors.carnet}</p>}
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Contacto</h3>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> Correo *
              </Label>
              <Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} disabled={isLoading} />
              {validationErrors.email && <p className="text-sm text-destructive">{validationErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> Correo personal (opcional)
              </Label>
              <Input type="email" value={formData.personalEmail} onChange={(e) => handleChange("personalEmail", e.target.value)} disabled={isLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Teléfono *
                </Label>
                <Input value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} disabled={isLoading} />
                {validationErrors.phone && <p className="text-sm text-destructive">{validationErrors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Dirección *
                </Label>
                <Input value={formData.address} onChange={(e) => handleChange("address", e.target.value)} disabled={isLoading} />
                {validationErrors.address && <p className="text-sm text-destructive">{validationErrors.address}</p>}
              </div>
            </div>
          </div>

          {/* Info de graduación (BD) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Información de Graduación</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Año de graduación *</Label>
                <Input
                  type="number"
                  value={formData.graduation_year}
                  onChange={(e) => handleChange("graduation_year", e.target.value)}
                  disabled={isLoading}
                />
                {validationErrors.graduation_year && (
                  <p className="text-sm text-destructive">{validationErrors.graduation_year}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Título del grado *</Label>
                <Input value={formData.degree_title} onChange={(e) => handleChange("degree_title", e.target.value)} disabled={isLoading} />
                {validationErrors.degree_title && (
                  <p className="text-sm text-destructive">{validationErrors.degree_title}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Major (opcional)</Label>
              <Input value={formData.major} onChange={(e) => handleChange("major", e.target.value)} disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <Label>Título de tesis (opcional)</Label>
              <Input value={formData.thesis_title} onChange={(e) => handleChange("thesis_title", e.target.value)} disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <Label>GPA final (opcional, 0 a 10)</Label>
              <Input value={formData.final_gpa} onChange={(e) => handleChange("final_gpa", e.target.value)} disabled={isLoading} />
              {validationErrors.final_gpa && <p className="text-sm text-destructive">{validationErrors.final_gpa}</p>}
            </div>
          </div>

          {/* Seguridad */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Seguridad</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contraseña *</Label>
                <Input type="password" value={formData.password} onChange={(e) => handleChange("password", e.target.value)} disabled={isLoading} />
                {validationErrors.password && <p className="text-sm text-destructive">{validationErrors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label>Confirmar contraseña *</Label>
                <Input type="password" value={formData.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} disabled={isLoading} />
                {validationErrors.confirmPassword && <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading || success}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando solicitud...
              </>
            ) : success ? (
              "Solicitud enviada"
            ) : (
              "Registrarme como Graduado"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

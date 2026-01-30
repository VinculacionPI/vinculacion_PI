"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, GraduationCap, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR = CURRENT_YEAR - 50
const MAX_YEAR = CURRENT_YEAR

const norm = (s: string) => (s ?? "").trim()

export default function UpgradeToGraduatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [profile, setProfile] = useState<any>(null)

  const [formData, setFormData] = useState({
    graduationYear: "", // ahora es input numérico
    degreeTitle: "",
    major: "",
    thesisTitle: "",
    finalGPA: "",
  })

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError

      if (!session) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase.from("USERS").select("*").eq("id", session.user.id).single()
      if (error) throw error

      if (data) {
        if (String(data.status ?? "").trim().toUpperCase() !== "ACTIVE") {
          router.replace("/login")
          return
        }

        setProfile(data)

        setFormData((prev) => ({
          ...prev,
          major: data.major ?? "",
          finalGPA: data.final_gpa?.toString() ?? "",
        }))
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError("No se pudo cargar la información del perfil")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession()

      if (sessionErr) throw sessionErr
      if (!session) throw new Error("No hay sesión activa")

      if (!norm(formData.graduationYear) || !norm(formData.degreeTitle)) {
        throw new Error("Año de graduación y título obtenido son obligatorios")
      }

      const graduationYearInt = Number(formData.graduationYear)
      if (!Number.isInteger(graduationYearInt)) {
        throw new Error("El año de graduación debe ser un número entero")
      }
      if (graduationYearInt < MIN_YEAR || graduationYearInt > MAX_YEAR) {
        throw new Error(`El año de graduación debe estar entre ${MIN_YEAR} y ${MAX_YEAR}`)
      }

      const gpaNum = norm(formData.finalGPA) === "" ? null : Number(formData.finalGPA)
      if (gpaNum !== null && (!Number.isFinite(gpaNum) || gpaNum < 0 || gpaNum > 10)) {
        throw new Error("El GPA debe estar entre 0 y 10")
      }

      const graduationRequest = {
        user_id: session.user.id,
        graduation_year: graduationYearInt,
        degree_title: norm(formData.degreeTitle),
        major: norm(formData.major) || null,
        thesis_title: norm(formData.thesisTitle) || null,
        final_gpa: gpaNum,
        status: "pending",
        requested_at: new Date().toISOString(),
      }

      const { error: requestError } = await supabase.from("graduation_requests").insert([graduationRequest])
      if (requestError) throw requestError

      await supabase.from("audit_logs").insert([
        {
          user_id: session.user.id,
          operation_type: "graduation_request",
          ip_address: "client-side",
          details: "Solicitud de cambio a egresado",
          metadata: {
            graduation_year: graduationYearInt,
            degree_title: norm(formData.degreeTitle),
            current_role: "student",
            requested_role: "graduate",
          },
        },
      ])

      try {
        await fetch("/api/notifications/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: profile?.email,
            subject: "Solicitud de Egreso Recibida",
            template: "graduation-request",
            data: {
              name: profile?.name,
              graduation_year: graduationYearInt,
              degree_title: norm(formData.degreeTitle),
            },
          }),
        })
      } catch (emailError) {
        console.warn("Error enviando email:", emailError)
      }

      setSuccess("Solicitud de egreso enviada exitosamente. Recibirá una notificación cuando sea aprobada.")

      setTimeout(() => {
        router.push("/dashboard/student/profile")
      }, 5000)
    } catch (err: any) {
      setError(err?.message ?? "Error enviando solicitud")
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

        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GraduationCap className="h-8 w-8" />
          Solicitar Actualización a Egresado
        </h1>

        <p className="text-gray-600 mt-2">
          Complete este formulario para solicitar el cambio de rol de Estudiante a Egresado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de Graduación</CardTitle>
          <CardDescription>Proporcione los datos requeridos para completar el proceso de egreso.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="graduationYear">Año de Graduación *</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  inputMode="numeric"
                  min={MIN_YEAR}
                  max={MAX_YEAR}
                  step={1}
                  value={formData.graduationYear}
                  onChange={(e) => setFormData((prev) => ({ ...prev, graduationYear: e.target.value }))}
                  placeholder={`Ej: ${CURRENT_YEAR}`}
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500">Rango permitido: {MIN_YEAR} – {MAX_YEAR}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="degreeTitle">Título Obtenido *</Label>
                <Input
                  id="degreeTitle"
                  value={formData.degreeTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, degreeTitle: e.target.value }))}
                  placeholder="Ej: Bachillerato en Ingeniería en Computación"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="major">Carrera / Especialidad</Label>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={(e) => setFormData((prev) => ({ ...prev, major: e.target.value }))}
                  placeholder="Ej: Ingeniería en Computación"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalGPA">Promedio Final (GPA)</Label>
                <Input
                  id="finalGPA"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.finalGPA}
                  onChange={(e) => setFormData((prev) => ({ ...prev, finalGPA: e.target.value }))}
                  placeholder="Ej: 8.5"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thesisTitle">Título del Trabajo Final (opcional)</Label>
              <Input
                id="thesisTitle"
                value={formData.thesisTitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, thesisTitle: e.target.value }))}
                placeholder="Ej: Sistema de Gestión de Proyectos TFG"
                disabled={loading}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-semibold text-blue-800 mb-2">⚠️ Importante:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Una vez aprobado como egresado, perderá acceso a oportunidades de TFG</li>
                <li>• Obtendrá acceso a oportunidades laborales y pasantías</li>
                <li>• Su perfil será visible para empleadores</li>
                <li>• Este proceso es irreversible sin autorización administrativa</li>
              </ul>
            </div>

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
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/student/profile")} disabled={loading}>
                Cancelar
              </Button>

              <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? "Enviando..." : "Solicitar Egreso"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

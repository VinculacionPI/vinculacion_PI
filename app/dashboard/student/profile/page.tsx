"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Mail,
  Phone,
  MapPin,
  IdCard,
  BookOpen,
  GraduationCap,
  Edit,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface StudentProfile {
  id: string
  name: string
  email: string
  personalEmail: string | null
  phone: string
  address: string
  cedula: string
  carnet: string
  semester: string
  role: string
  status: string
  created_at: string
}

export default function StudentProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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
        // ✅ si está desactivado (403) o no autenticado (401), lo sacamos
        if (response.status === 401 || response.status === 403) {
          router.replace("/login")
          return
        }
        throw new Error("Error al cargar perfil")
      }

      const data = (await response.json()) as StudentProfile
      setProfile(data)
    } catch (err: any) {
      setError(err?.message ?? "Error cargando perfil")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Cargando perfil...</div>
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>
  if (!profile) return <div className="p-8 text-center">No se encontró el perfil</div>

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/student" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-gray-600 mt-2">Gestiona tu información personal y académica</p>
          </div>

          {/* ✅ Editar + Eliminar + Solicitar Egreso */}
          <div className="flex gap-3 items-center">
            <Button asChild variant="outline">
              <Link href="/dashboard/student/profile/edit" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Editar Perfil
              </Link>
            </Button>

            <DeleteProfileButton />

            {(profile.role ?? "").toLowerCase() === "student" && (
              <Button asChild>
                <Link href="/dashboard/student/upgrade-to-graduate" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Solicitar Egreso
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <InfoField icon={<User className="h-4 w-4" />} label="Nombre Completo" value={profile.name} />
              <InfoField icon={<IdCard className="h-4 w-4" />} label="Cédula" value={profile.cedula} />
              <InfoField icon={<IdCard className="h-4 w-4" />} label="Carné" value={profile.carnet} />
              <InfoField icon={<Mail className="h-4 w-4" />} label="Correo Institucional" value={profile.email} />
              <InfoField
                icon={<Mail className="h-4 w-4" />}
                label="Correo Personal"
                value={profile.personalEmail || "No registrado"}
              />
              <InfoField
                icon={<Phone className="h-4 w-4" />}
                label="Teléfono"
                value={profile.phone || "No registrado"}
              />
              <InfoField icon={<MapPin className="h-4 w-4" />} label="Dirección" value={profile.address} />
              <InfoField
                icon={<BookOpen className="h-4 w-4" />}
                label="Semestre"
                value={`Semestre ${profile.semester}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de la Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={(profile.role ?? "").toLowerCase() === "student" ? "default" : "secondary"}>
                  {(profile.role ?? "").toLowerCase() === "student" ? "Estudiante" : "Egresado"}
                </Badge>

                <Badge variant={(profile.status ?? "").toLowerCase() === "active" ? "default" : "destructive"}>
                  {(profile.status ?? "").toLowerCase() === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <p className="text-sm text-gray-500">
                Miembro desde: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Acciones Disponibles</h3>
              <p className="text-sm text-gray-500">¿Necesitas cambiar datos no editables?</p>
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link href="/dashboard/student/profile/request-change">Solicitar cambio administrativo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DeleteProfileButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleDelete = async () => {
    setErr(null)

    const ok = window.confirm(
      "¿Seguro que deseas eliminar tu perfil?\n\nTu cuenta será desactivada y no podrás volver a ingresar."
    )
    if (!ok) return

    try {
      setLoading(true)

      const res = await fetch("/api/profile", { method: "DELETE" })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? "No se pudo eliminar el perfil")
      }

      router.replace("/login")
      router.refresh()
    } catch (e: any) {
      setErr(e?.message ?? "Error eliminando perfil")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="destructive" onClick={handleDelete} disabled={loading}>
        {loading ? "Eliminando..." : "Eliminar Perfil"}
      </Button>
      {err ? <span className="text-xs text-red-600">{err}</span> : null}
    </div>
  )
}

function InfoField({ icon, label, value }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-medium break-words">{value}</p>
    </div>
  )
}

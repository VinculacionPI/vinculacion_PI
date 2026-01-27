"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, IdCard, GraduationCap, Edit, ArrowLeft, Award, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface GraduateProfile {
  id: string
  name: string
  email: string
  personalEmail: string | null
  phone: string
  address: string
  cedula: string
  carnet: string
  role: string
  status: string
  created_at: string
  graduation_year?: number
  degree_title?: string
  major?: string
  thesis_title?: string
  final_gpa?: number
}

export default function GraduateProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<GraduateProfile | null>(null)
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
        if (response.status === 401) {
          router.replace("/login")
          return
        }
        throw new Error("Error al cargar perfil")
      }

      const data = await response.json()
      setProfile(data as GraduateProfile)
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
          <Link href="/dashboard/graduate" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-gray-600 mt-2">Gestiona tu información personal y académica</p>
          </div>

          <Button asChild variant="outline">
            <Link href="/dashboard/graduate/profile/edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar Perfil
            </Link>
          </Button>
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
              <InfoField icon={<Mail className="h-4 w-4" />} label="Correo Personal" value={profile.personalEmail || "No registrado"} />
              <InfoField icon={<Phone className="h-4 w-4" />} label="Teléfono" value={profile.phone || "No registrado"} />
              <InfoField icon={<MapPin className="h-4 w-4" />} label="Dirección" value={profile.address} className="md:col-span-2" />
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
                <Badge variant="secondary">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Graduado
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
                <Link href="/dashboard/graduate/profile/request-change">Solicitar cambio administrativo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Información Académica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.graduation_year && (
              <InfoField 
                icon={<Calendar className="h-4 w-4" />} 
                label="Año de Graduación" 
                value={profile.graduation_year.toString()} 
              />
            )}
            {profile.degree_title && (
              <InfoField 
                icon={<Award className="h-4 w-4" />} 
                label="Título del Grado" 
                value={profile.degree_title} 
              />
            )}
            {profile.major && (
              <InfoField 
                icon={<GraduationCap className="h-4 w-4" />} 
                label="Major" 
                value={profile.major} 
              />
            )}
            {profile.thesis_title && (
              <InfoField 
                icon={<GraduationCap className="h-4 w-4" />} 
                label="Título de Tesis" 
                value={profile.thesis_title} 
                className="md:col-span-2 lg:col-span-3"
              />
            )}
            {profile.final_gpa && (
              <InfoField 
                icon={<Award className="h-4 w-4" />} 
                label="GPA Final" 
                value={profile.final_gpa.toFixed(2)} 
              />
            )}
          </div>

          {!profile.graduation_year && !profile.degree_title && (
            <p className="text-sm text-gray-500 text-center py-4">
              No se ha registrado información académica de graduación
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoField({ icon, label, value, className }: any) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-medium break-words">{value}</p>
    </div>
  )
}

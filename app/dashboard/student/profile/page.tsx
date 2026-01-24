"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, IdCard, BookOpen, Calendar, GraduationCap, Edit, FileText, ArrowLeft } from "lucide-react"
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
      
      setProfile(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Cargando perfil...</div>
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>
  if (!profile) return <div className="p-8 text-center">No se encontró el perfil</div>

  return (
    <div className="container max-w-6xl mx-auto py-8">
      {/* Encabezado */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/student" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-gray-600 mt-2">
              Gestiona tu información personal y académica
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/student/profile/edit" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Editar Perfil
              </Link>
            </Button>
            {profile.role === "student" && (
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
        {/* Información Personal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <InfoField 
                icon={<User className="h-4 w-4" />}
                label="Nombre Completo"
                value={profile.name}
                isEditable={false}
              />
              <InfoField 
                icon={<IdCard className="h-4 w-4" />}
                label="Cédula"
                value={profile.cedula}
                isEditable={false}
              />
              <InfoField 
                icon={<IdCard className="h-4 w-4" />}
                label="Carné"
                value={profile.carnet}
                isEditable={false}
              />
              <InfoField 
                icon={<Mail className="h-4 w-4" />}
                label="Correo Institucional"
                value={profile.email}
                isEditable={false}
              />
              <InfoField 
                icon={<Mail className="h-4 w-4" />}
                label="Correo Personal"
                value={profile.personalEmail || "No registrado"}
                isEditable={true}
              />
              <InfoField 
                icon={<Phone className="h-4 w-4" />}
                label="Teléfono"
                value={profile.phone}
                isEditable={true}
              />
              <InfoField 
                icon={<MapPin className="h-4 w-4" />}
                label="Dirección"
                value={profile.address}
                isEditable={false}
              />
              <InfoField 
                icon={<BookOpen className="h-4 w-4" />}
                label="Semestre"
                value={`Semestre ${profile.semester}`}
                isEditable={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Estado y Acciones */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de la Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={profile.role === "student" ? "default" : "secondary"}>
                  {profile.role === "student" ? "Estudiante" : "Egresado"}
                </Badge>
                <Badge variant={profile.status === "active" ? "default" : "destructive"}>
                  {profile.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                Miembro desde: {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Acciones Disponibles</h3>
              <p className="text-sm text-gray-500 mb-2">
                ¿Necesitas cambiar datos no editables?
              </p>
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link href="/dashboard/student/profile-request-change">
                  Solicitar cambio administrativo
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoField({ icon, label, value, isEditable }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        {icon}
        <span>{label}</span>
        {isEditable && (
          <Badge variant="outline" className="text-xs">
            Editable
          </Badge>
        )}
      </div>
      <p className="font-medium">{value}</p>
    </div>
  )
}
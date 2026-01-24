"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { Loader2, ArrowLeft, Save, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    cedula: "",
    phone: "",
    personalEmail: "",
    carnet: "",
    semester: "",
    address: "",
    role: "",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login")
          return
        }
        throw new Error("Error al cargar perfil")
      }

      const data = await response.json()
      setProfile({
        name: data.name || "",
        email: data.email || "",
        cedula: data.cedula || "",
        phone: data.phone || "",
        personalEmail: data.personalEmail || "",
        carnet: data.carnet || "",
        semester: data.semester || "",
        address: data.address || "",
        role: data.role || "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al actualizar perfil")
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader userName={profile.name} userRole={profile.role} />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={profile.name} userRole={profile.role} />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Link href={`/dashboard/${profile.role}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mi Perfil</CardTitle>
            <CardDescription>Actualiza tu información personal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input
                    id="cedula"
                    value={profile.cedula}
                    onChange={(e) => handleChange("cedula", e.target.value)}
                    required
                    disabled={isSaving}
                    placeholder="1-2345-6789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Institucional *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    No se puede modificar el email institucional
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personalEmail">Email Personal</Label>
                  <Input
                    id="personalEmail"
                    type="email"
                    value={profile.personalEmail}
                    onChange={(e) => handleChange("personalEmail", e.target.value)}
                    disabled={isSaving}
                    placeholder="personal@ejemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    required
                    disabled={isSaving}
                    placeholder="8888-8888"
                  />
                </div>

                {profile.role === "student" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="carnet">Carnet</Label>
                      <Input
                        id="carnet"
                        value={profile.carnet}
                        onChange={(e) => handleChange("carnet", e.target.value)}
                        disabled={isSaving}
                        placeholder="2020123456"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="semester">Semestre</Label>
                      <Select
                        value={profile.semester}
                        onValueChange={(value: string) => handleChange("semester", value)}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecciona un semestre" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => (i + 1).toString()).map((sem) => (
                            <SelectItem key={sem} value={sem}>
                              Semestre {sem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  disabled={isSaving}
                  placeholder="Dirección completa"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950 p-3 rounded-md flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Perfil actualizado exitosamente
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { 
  Bell, 
  Mail, 
  Briefcase, 
  FileText, 
  AlertCircle,
  Save,
  ArrowLeft
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    push_enabled: true,
    nuevo_interes: true,
    cambio_estado: true,
    nueva_publicacion: true,
    recordatorio: true,
  })

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    // Usuario de prueba
    const testUserId = '3d146d09-c6ae-4dbe-b4e3-7045a5e1964a'
    setUserId(testUserId)

    try {
      const { data, error } = await supabase
        .from('USER_PREFERENCES')
        .select('*')
        .eq('user_id', testUserId)
        .single()

      if (data) {
        setPreferences({
          email_enabled: data.email_enabled ?? true,
          push_enabled: data.push_enabled ?? true,
          nuevo_interes: data.preferences?.nuevo_interes ?? true,
          cambio_estado: data.preferences?.cambio_estado ?? true,
          nueva_publicacion: data.preferences?.nueva_publicacion ?? true,
          recordatorio: data.preferences?.recordatorio ?? true,
        })
      }
    } catch (error) {
      console.error('Error cargando preferencias:', error)
    }
  }

  const handleSave = async () => {
    if (!userId) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('USER_PREFERENCES')
        .upsert({
          user_id: userId,
          email_enabled: preferences.email_enabled,
          push_enabled: preferences.push_enabled,
          preferences: {
            nuevo_interes: preferences.nuevo_interes,
            cambio_estado: preferences.cambio_estado,
            nueva_publicacion: preferences.nueva_publicacion,
            recordatorio: preferences.recordatorio,
          },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      alert('Preferencias guardadas exitosamente')
    } catch (error: any) {
      console.error('Error guardando preferencias:', error)
      alert('Error guardando preferencias: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/dashboard/student">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Preferencias de Notificaciones</h1>
          <p className="text-muted-foreground">
            Configura cómo y cuándo deseas recibir notificaciones
          </p>
        </div>

        <div className="space-y-6">
          {/* Configuración general */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configuración General
              </CardTitle>
              <CardDescription>
                Activa o desactiva los canales de notificación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-enabled" className="text-base font-medium">
                    Notificaciones por Email
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe notificaciones en tu correo electrónico
                  </p>
                </div>
                <Switch
                  id="email-enabled"
                  checked={preferences.email_enabled}
                  onCheckedChange={(checked: boolean) => 
                    setPreferences({ ...preferences, email_enabled: checked })
                  }
                />
              </div>  

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-enabled" className="text-base font-medium">
                    Notificaciones Push
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe notificaciones en tiempo real en la plataforma
                  </p>
                </div>
                <Switch
                  id="push-enabled"
                  checked={preferences.push_enabled}
                  onCheckedChange={(checked: boolean) => 
                    setPreferences({ ...preferences, push_enabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Tipos de notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Notificaciones</CardTitle>
              <CardDescription>
                Selecciona qué eventos deseas que te notifiquen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                  <div className="space-y-0.5">
                    <Label htmlFor="nuevo-interes" className="text-base font-medium">
                      Nuevo Interés en Oportunidad
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Cuando un estudiante muestra interés en tu oportunidad
                    </p>
                  </div>
                </div>
                <Switch
                  id="nuevo-interes"
                  checked={preferences.nuevo_interes}
                  onCheckedChange={(checked: boolean) => 
                    setPreferences({ ...preferences, nuevo_interes: checked })
                  }
                  disabled={!preferences.push_enabled && !preferences.email_enabled}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div className="space-y-0.5">
                    <Label htmlFor="cambio-estado" className="text-base font-medium">
                      Cambio de Estado
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Cuando una oportunidad cambia de estado
                    </p>
                  </div>
                </div>
                <Switch
                  id="cambio-estado"
                  checked={preferences.cambio_estado}
                  onCheckedChange={(checked: boolean) => 
                    setPreferences({ ...preferences, cambio_estado: checked })
                  }
                  disabled={!preferences.push_enabled && !preferences.email_enabled}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-500" />
                  <div className="space-y-0.5">
                    <Label htmlFor="nueva-publicacion" className="text-base font-medium">
                      Nueva Publicación
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Cuando se publica una nueva oportunidad relevante
                    </p>
                  </div>
                </div>
                <Switch
                  id="nueva-publicacion"
                  checked={preferences.nueva_publicacion}
                  onCheckedChange={(checked: boolean) => 
                    setPreferences({ ...preferences, nueva_publicacion: checked })
                  }
                  disabled={!preferences.push_enabled && !preferences.email_enabled}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-purple-500" />
                  <div className="space-y-0.5">
                    <Label htmlFor="recordatorio" className="text-base font-medium">
                      Recordatorios
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recordatorios de fechas límite y próximos eventos
                    </p>
                  </div>
                </div>
                <Switch
                  id="recordatorio"
                  checked={preferences.recordatorio}
                  onCheckedChange={(checked: boolean) => 
                    setPreferences({ ...preferences, recordatorio: checked })
                  }
                  disabled={!preferences.push_enabled && !preferences.email_enabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Las notificaciones por email pueden tardar algunos minutos en llegar
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  <Bell className="h-3 w-3 mr-1" />
                  Push
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Las notificaciones push aparecen instantáneamente en la plataforma
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botón guardar */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => loadPreferences()}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
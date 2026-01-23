"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Mail, Lock, User, IdCard, Phone, MapPin, BookOpen, GraduationCap, AlertCircle } from "lucide-react"

type Semester = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"

interface StudentFormData {
  name: string
  cedula: string
  carnet: string
  institutionalEmail: string
  personalEmail: string
  phone: string
  address: string
  password: string
  confirmPassword: string
  semester: Semester
}

export function StudentRegisterForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<StudentFormData>({
    name: "",
    cedula: "",
    carnet: "",
    institutionalEmail: "",
    personalEmail: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    semester: "1"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Verificar si ya hay sesión
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.log("No hay sesión activa, continuando con registro")
      }
    }
    checkSession()
  }, [router])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Validar nombre
    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido"
    } else if (formData.name.trim().length < 3) {
      errors.name = "El nombre debe tener al menos 3 caracteres"
    }

    // Validar correo institucional
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(estudiantec\.cr|itcr\.ac\.cr)$/
    if (!emailRegex.test(formData.institutionalEmail)) {
      errors.institutionalEmail = "Debe usar un correo institucional válido (@estudiantec.cr o @itcr.ac.cr)"
    }

    // Validar cédula
    const cedulaRegex = /^\d{9}$/
    if (!cedulaRegex.test(formData.cedula)) {
      errors.cedula = "La cédula debe tener 9 dígitos numéricos"
    }

    // Validar carnet
    const carnetRegex = /^\d{7,10}$/
    if (!carnetRegex.test(formData.carnet)) {
      errors.carnet = "El carnet debe contener entre 7 y 10 dígitos numéricos"
    }

    // Validar contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(formData.password)) {
      errors.password = "Mínimo 8 caracteres con mayúsculas, minúsculas y números"
    }

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden"
    }

    // Validar teléfono
    const phoneRegex = /^\d{8}$/
    if (!phoneRegex.test(formData.phone)) {
      errors.phone = "El teléfono debe tener 8 dígitos"
    }

    // Validar dirección
    if (!formData.address.trim()) {
      errors.address = "La dirección es requerida"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      console.log("🚀 Iniciando proceso de registro...")
      
      // Crear cliente Supabase
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      console.log("✅ Cliente Supabase inicializado")

      // 1. Verificar unicidad ANTES de crear usuario
      console.log("🔍 Verificando datos únicos...")
      
      try {
        // Verificar correo 
        const { data: existingStudent } = await supabase
          .from('USERS')
          .select('id')
          .eq('email', formData.institutionalEmail)
          .maybeSingle()

        if (existingStudent) {
          throw new Error("Este correo institucional ya está registrado")
        }

        // Verificar cédula
        const { data: existingCedula } = await supabase
          .from('USERS')
          .select('id')
          .eq('cedula', formData.cedula)
          .maybeSingle()

        if (existingCedula) {
          throw new Error("Esta cédula ya está registrada")
        }

        // Verificar carnet
        const { data: existingCarnet } = await supabase
        .from('USERS')
          .select('id')
          .eq('carnet', formData.carnet)
          .maybeSingle()

        if (existingCarnet) {
          throw new Error("Este carnet ya está registrado")
        }
        
        console.log("✅ Datos únicos verificados correctamente")
      } catch (checkError) {
        console.error(" Error en verificación de unicidad:", checkError)
        throw checkError
      }

      // 2. Registrar en Supabase Auth
      console.log("👤 Registrando en Supabase Auth...")
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.institutionalEmail,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: 'student',
            carnet: formData.carnet,
            cedula: formData.cedula,
            semester: formData.semester
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      console.log("📨 Respuesta de signUp recibida")

      if (authError) {
        console.error('❌ Error de Auth:', {
          code: authError.code,
          message: authError.message,
          status: authError.status
        })

        if (authError.message.includes('already registered') || authError.code === 'user_already_exists') {
          throw new Error("Este correo ya está registrado en el sistema")
        }
        
        if (authError.message.includes('password') || authError.code === 'weak_password') {
          throw new Error("La contraseña no cumple los requisitos. Use al menos 8 caracteres con mayúsculas, minúsculas y números.")
        }
        
        if (authError.message.includes('rate limit') || authError.code === 'rate_limit_exceeded') {
          throw new Error("Demasiados intentos. Espere unos minutos.")
        }
        
        if (authError.message.includes('fetch') || authError.message.includes('network')) {
          throw new Error("Error de conexión. Verifique su internet.")
        }
        
        throw new Error(`Error de registro: ${authError.message}`)
      }

      if (!authData?.user) {
        throw new Error("No se pudo crear el usuario. Intente nuevamente.")
      }

      console.log("✅ Usuario creado en Auth con ID:", authData.user.id)

      // 3. Crear perfil de estudiante en la tabla students
      console.log("📝 Creando perfil de estudiante...")
      
      const studentData = {
        id: authData.user.id,
        name: formData.name.trim(),
        cedula: formData.cedula,
        carnet: formData.carnet,
        email: formData.institutionalEmail.toLowerCase(),
        personalEmail: formData.personalEmail?.trim().toLowerCase() || null,
        phone: formData.phone,
        address: formData.address.trim(),
        semester: parseInt(formData.semester),
        role: 'student',
        status: 'active'
      }

      console.log("📊 Datos a insertar:", studentData)

      // Intentar insertar directamente primero
      const { data: profileData, error: profileError } = await supabase
        .from('USERS')
        .insert([studentData] as any)
        .select()
        .single()

      if (profileError) {
        console.error('❌ Error al crear perfil:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details
        })

        // Si es error de permisos RLS, usar el método alternativo
        if (profileError.code === '42501') {
          console.log("⚠️ Error de permisos RLS, intentando método alternativo...")
          
          // Método alternativo: Intentar con fetch a una API route
          try {
            const response = await fetch('/api/auth/register/students', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                user_id: authData.user.id,
                name: formData.name.trim(),
                cedula: formData.cedula,
                carnet: formData.carnet,
                institutional_email: formData.institutionalEmail.toLowerCase(),
                personal_email: formData.personalEmail?.trim().toLowerCase() || null,
                phone: formData.phone,
                address: formData.address.trim(),
                semester: parseInt(formData.semester)
              })
            })

            // Verificar si la respuesta es JSON
            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
              const text = await response.text()
              console.error("❌ Respuesta no es JSON:", text.substring(0, 200))
              throw new Error("Error del servidor - respuesta no válida")
            }

            const result = await response.json()
            
            if (!response.ok) {
              console.error("❌ Error en API route:", result)
              throw new Error(result.message || "Error al crear perfil via API")
            }

            console.log("✅ Perfil creado via API route:", result)
          } catch (apiError: any) {
            console.error("❌ Error en método alternativo:", apiError)
            // Si falla todo, al menos el usuario está creado en Auth
            // Mostrar mensaje informativo
            setSuccess(true)
            setError("✅ Usuario registrado exitosamente. Su perfil será activado manualmente por el administrador.")
            
            // No redirigir, dejar que el usuario vea el mensaje
            setIsLoading(false)
            return
          }
        } else if (profileError.code === '23505') {
          // Error de unicidad
          if (profileError.message.includes('institutional_email')) {
            throw new Error("Este correo ya está registrado")
          }
          if (profileError.message.includes('cedula')) {
            throw new Error("Esta cédula ya está registrada")
          }
          if (profileError.message.includes('carnet')) {
            throw new Error("Este carnet ya está registrado")
          }
          throw new Error("Datos duplicados detectados")
        } else {
          throw new Error(`Error al crear perfil: ${profileError.message}`)
        }
      } else {
        console.log("✅ Perfil creado exitosamente:", profileData)
      }

      // 4. Registrar auditoría (opcional, usar try-catch para evitar errores)
      try {
        const auditData = {
          user_id: authData.user.id,
          operation_type: 'registration',
          ip_address: 'client-side',
          details: `Registro de estudiante: ${formData.name} (${formData.carnet})`,
          metadata: {
            email: formData.institutionalEmail,
            carnet: formData.carnet,
            cedula: formData.cedula,
            semester: formData.semester
          }
        }

        await supabase
          .from('audit_logs')
          .insert([auditData] as any)
        
        console.log("📋 Auditoría registrada")
      } catch (auditError) {
        console.warn("⚠️ Error en auditoría (no crítico):", auditError)
        // No lanzar error, solo continuar
      }

      // 5. Éxito - mostrar mensaje y redirigir
      setSuccess(true)
      console.log("🎉 Registro completado exitosamente")

      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/login?registered=true&email=' + encodeURIComponent(formData.institutionalEmail))
      }, 3000)

    } catch (err) {
      console.error('💥 Error completo en registro:', err)
      setError(err instanceof Error ? err.message : "Error desconocido durante el registro")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error de validación cuando el usuario modifica el campo
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <GraduationCap className="h-7 w-7" />
          Registro de Estudiante
        </CardTitle>
        <CardDescription className="text-base">
          Completa todos los campos con tu información institucional
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mensaje de éxito */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex gap-3">
              <AlertCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-green-700 text-sm">
                {error ? error : "¡Registro exitoso! Redirigiendo a la página de confirmación..."}
              </p>
            </div>
          )}

          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Información Personal</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre Completo *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez Rodríguez"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cedula" className="flex items-center gap-2">
                  <IdCard className="h-4 w-4" />
                  Número de Cédula *
                </Label>
                <Input
                  id="cedula"
                  type="text"
                  placeholder="123456789"
                  value={formData.cedula}
                  onChange={(e) => handleChange("cedula", e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
                {validationErrors.cedula && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.cedula}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="carnet" className="flex items-center gap-2">
                  <IdCard className="h-4 w-4" />
                  Número de Carnet *
                </Label>
                <Input
                  id="carnet"
                  type="text"
                  placeholder="2023001234"
                  value={formData.carnet}
                  onChange={(e) => handleChange("carnet", e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
                {validationErrors.carnet && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.carnet}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Información de Contacto</h3>
            
            <div className="space-y-2">
              <Label htmlFor="institutionalEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo Institucional *
              </Label>
              <Input
                id="institutionalEmail"
                type="email"
                placeholder="usuario@estudiantec.cr"
                value={formData.institutionalEmail}
                onChange={(e) => handleChange("institutionalEmail", e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Solo se permiten dominios: @estudiantec.cr o @itcr.ac.cr
              </p>
              {validationErrors.institutionalEmail && (
                <p className="text-sm text-destructive mt-1">{validationErrors.institutionalEmail}</p>
              )}
            </div>

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
                onChange={(e) => handleChange("personalEmail", e.target.value)}
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
                {validationErrors.phone && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección *
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Dirección completa, provincia, cantón, distrito"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
                {validationErrors.address && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información Académica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Información Académica</h3>
            
            <div className="space-y-2">
              <Label htmlFor="semester" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Semestre del Proyecto *
              </Label>
              <Select
                value={formData.semester}
                onValueChange={(value: string) => handleChange("semester", value)}
                disabled={isLoading}
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
          </div>

          {/* Seguridad */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Seguridad</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Contraseña *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
                {validationErrors.password && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres con mayúsculas, minúsculas y números
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirmar Contraseña *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
                {validationErrors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          {/* Mensaje de error (solo si no es un mensaje de éxito) */}
          {error && !success && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex gap-3">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold" 
            disabled={isLoading || success}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Registrando estudiante...
              </>
            ) : success ? (
              "¡Registro Exitoso!"
            ) : (
              "Registrarse como Estudiante"
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
            <br />
            <span className="text-xs">Se enviará un correo de confirmación a tu dirección institucional.</span>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
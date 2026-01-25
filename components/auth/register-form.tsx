"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, GraduationCap, Users, Building2, ChevronLeft } from "lucide-react"
import { StudentRegisterForm } from "./student-register-form"
import { CompanyRegisterForm } from "./company-register-form"

type UserRole = "student" | "graduate" | "company"

interface BasicFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
}

export function RegisterForm() {
  const router = useRouter()
  const [activeForm, setActiveForm] = useState<"none" | "student" | "company">("none")
  const [formData, setFormData] = useState<BasicFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Si el usuario selecciona "Estudiante", mostrar el formulario específico
  const handleRoleSelect = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }))
    setActiveForm("none")
  }


  const handleBackToRoleSelection = () => {
    setActiveForm("none")
    setError("")
  }

  // Manejar registro para graduate y company
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    // Validación adicional para graduate y company
    if (formData.role === "graduate" || formData.role === "company") {
      // Aquí puedes agregar validaciones específicas para cada rol
      if (!formData.email.includes("@")) {
        setError("Por favor ingresa un correo electrónico válido")
        setIsLoading(false)
        return
      }
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al registrarse")
      }

      router.push("/login?registered=true")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  // Si se seleccionó algún formulario específico, mostrarlo
  if (activeForm === "student") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={handleBackToRoleSelection}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a selección de tipo de usuario
        </Button>

        <StudentRegisterForm />
      </div>
    )
  }

  if (activeForm === "company") {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={handleBackToRoleSelection}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a selección de tipo de usuario
        </Button>

        <CompanyRegisterForm />
      </div>
    )
  }


  // Formulario original para selección de rol
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        <CardDescription className="text-base">
          Selecciona tu tipo de usuario para continuar con el registro
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Selecciona tu rol</Label>
            <RadioGroup
              value={formData.role}
              onValueChange={(value) => handleRoleSelect(value as UserRole)}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Estudiante */}
              <div>
                <RadioGroupItem value="student" id="student" className="peer sr-only" />
                <Label
                  htmlFor="student"
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all hover:scale-[1.02] h-full"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Estudiante</span>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Registro con correo institucional y datos académicos
                    </p>
                  </div>
                </Label>
              </div>

              {/* Graduado */}
              <div>
                <RadioGroupItem value="graduate" id="graduate" className="peer sr-only" />
                <Label
                  htmlFor="graduate"
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all hover:scale-[1.02] h-full"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Graduado</span>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Acceso a oportunidades laborales y pasantías
                    </p>
                  </div>
                </Label>
              </div>

              {/* Empresa */}
              <div>
                <RadioGroupItem value="company" id="company" className="peer sr-only" />
                <Label
                  htmlFor="company"
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all hover:scale-[1.02] h-full"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Empresa</span>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Publicar ofertas laborales y buscar talento
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mostrar formulario según el rol seleccionado (excepto estudiante) */}
          {formData.role !== "student" && formData.role !== "company" && (
            <div className="space-y-6 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">Nombre Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={ "Nombre completo"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={ "Correo electrónico"}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-base">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
              </div>

              {formData.role === "graduate" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Como graduado, necesitarás verificar tu identidad 
                    mediante documentación oficial. Después del registro, te contactaremos 
                    para completar el proceso.
                  </p>
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold" 
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  `Registrarme como ${"Graduado"}`
                )}
              </Button>
            </div>
          )}

          {/* Si seleccionó estudiante, mostrar botón para continuar */}
          {formData.role === "student" && (
            <div className="pt-4 border-t">
              <Button
                type="button"
                className="w-full h-12 text-base font-semibold"
                onClick={() => setActiveForm("student")}
                size="lg"
              >
                Continuar con Registro de Estudiante
              </Button>
              
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Requisitos para estudiantes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Correo institucional (@estudiantec.cr o @itcr.ac.cr)</li>
                  <li>• Cédula costarricense (9 dígitos)</li>
                  <li>• Número de carnet institucional</li>
                  <li>• Contraseña segura (mínimo 8 caracteres)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Si seleccionó empresa, mostrar botón para continuar */}
          {formData.role === "company" && (
            <div className="pt-4 border-t">
              <Button
                type="button"
                className="w-full h-12 text-base font-semibold"
                onClick={() => setActiveForm("company")}
                size="lg"
              >
                Continuar con Registro de Empresa
              </Button>
              
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Requisitos para empresas:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Nombre legal de la empresa</li>
                  <li>• Correo empresarial</li>
                  <li>• Persona de contacto</li>
                  <li>• Contraseña segura (mínimo 8 caracteres)</li>
                </ul>
              </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Como empresa, tu registro será revisado por nuestro 
                    equipo administrativo. Te contactaremos para verificar la información 
                    antes de activar tu cuenta.
                  </p>
                </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
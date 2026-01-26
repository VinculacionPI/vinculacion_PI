"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { GraduationCap, Users, Building2, ChevronLeft } from "lucide-react"
import { StudentRegisterForm } from "./student-register-form"
import { CompanyRegisterForm } from "./company-register-form"
import { GraduateRegisterForm } from "./graduate-register-form"

type UserRole = "student" | "graduate" | "company"

interface BasicFormData {
  role: UserRole
}

export function RegisterForm() {
  const [activeForm, setActiveForm] = useState<"none" | "student" | "graduate" | "company">("none")
  const [formData, setFormData] = useState<BasicFormData>({
    role: "student",
  })
  const [error, setError] = useState("")

  const handleRoleSelect = (role: UserRole) => {
    setFormData({ role })
    setActiveForm("none")
    setError("")
  }

  const handleBackToRoleSelection = () => {
    setActiveForm("none")
    setError("")
  }

  // ====== Render forms específicos ======
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

  if (activeForm === "graduate") {
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

        <GraduateRegisterForm />
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

  // ====== Selección de rol ======
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        <CardDescription className="text-base">
          Selecciona tu tipo de usuario para continuar con el registro
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
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

          {/* Acciones según rol */}
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

          {formData.role === "graduate" && (
            <div className="pt-4 border-t">
              <Button
                type="button"
                className="w-full h-12 text-base font-semibold"
                onClick={() => setActiveForm("graduate")}
                size="lg"
              >
                Continuar con Registro de Graduado
              </Button>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Requisitos para graduados:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Correo válido</li>
                  <li>• Cédula costarricense (9 dígitos)</li>
                  <li>• Carnet (si aplica)</li>
                  <li>• Contraseña segura (mínimo 8 caracteres)</li>
                </ul>
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Tu registro como graduado quedará <strong>pendiente de aprobación</strong> por un administrador.
                </p>
              </div>
            </div>
          )}

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

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Como empresa, tu registro será revisado por nuestro equipo administrativo antes de activar tu cuenta.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-md border border-destructive/20">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

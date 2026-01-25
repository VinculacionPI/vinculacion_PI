"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Building2, Mail, User, Lock, AlertCircle } from "lucide-react"

interface CompanyFormData {
  companyName: string
  companyEmail: string
  sector: string
  description: string
  contactPerson: string
  password: string
  confirmPassword: string
  logoFile?: File | null
}

export function CompanyRegisterForm() {
  const router = useRouter()

  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: "",
    companyEmail: "",
    sector: "",
    description: "",
    contactPerson: "",
    password: "",
    confirmPassword: "",
    logoFile: null
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof CompanyFormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.companyName.trim()) {
        errors.companyName = "El nombre de la empresa es requerido"
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.companyEmail)) {
        errors.companyEmail = "Correo empresarial inválido"
    }

    if (!formData.sector.trim()) {
        errors.sector = "El sector es requerido"
    }

    if (!formData.description.trim() || formData.description.length < 20) {
        errors.description = "La descripción debe tener al menos 20 caracteres"
    }

    if (!formData.contactPerson.trim()) {
        errors.contactPerson = "La persona de contacto es requerida"
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(formData.password)) {
        errors.password =
        "Mínimo 8 caracteres, con mayúsculas, minúsculas y números"
    }

    if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Las contraseñas no coinciden"
    }
    
    if (formData.logoFile) {
      const allowedTypes = ["image/png", "image/jpeg"];
      if (!allowedTypes.includes(formData.logoFile.type)) {
        errors.logoFile = "El logo debe ser PNG o JPG";
      }
      if (formData.logoFile.size > 2 * 1024 * 1024) {
        errors.logoFile = "El tamaño máximo permitido es 2 MB";
      }
    } else {
      errors.logoFile = "Se requiere un logo de la empresa";
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    // Correo de empresa
    const { data: existingCompanyEmail } = await supabase
    .from("COMPANIES")
    .select("id")
    .eq("email", formData.companyEmail.toLowerCase())
    .maybeSingle()

    if (existingCompanyEmail) {
    throw new Error("Este correo empresarial ya está registrado")
    }

    // Nombre de empresa
    const { data: existingCompanyName } = await supabase
    .from("COMPANIES")
    .select("id")
    .ilike("name", formData.companyName.trim())
    .maybeSingle()

    if (existingCompanyName) {
    throw new Error("Esta empresa ya está registrada")
    }


    try {

      let logoPath: string | null = null;

      if (formData.logoFile) {
        const formDataToSend = new FormData();
        formDataToSend.append("logo", formData.logoFile);

        const response = await fetch("/api/company/upload-logo", {
          method: "POST",
          body: formDataToSend,
        });

        const data = await response.json();

        if (!data.publicUrl) {
          throw new Error("No se pudo obtener la URL pública del logo");
        }

        logoPath = data.publicUrl;
      }

      // Crear usuario en Supabase Auth
      const { data: result, error: rpcError } = await supabase.rpc(
        "register_company",
        {
            p_name: formData.companyName.trim(),
            p_email: formData.companyEmail.toLowerCase(),
            p_sector: formData.sector.trim(),
            p_description: formData.description.trim(),
            p_owner_email: formData.contactPerson.trim(),
            p_password_hash: formData.password,
            p_logo_path: logoPath
        }
        )

        switch (result) {
        case 1:

        await fetch("/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            companyName: formData.companyName,
            companyEmail: formData.companyEmail
            })
        })
            setSuccess(true)
            setTimeout(() => {
            router.push("/login?registered=company")
            }, 3000)
            break

        case 2:
            throw new Error(
            "Su empresa fue rechazada recientemente. Intente nuevamente en 30 días."
            )

        case 3:
            throw new Error("Esta empresa ya se encuentra registrada")

        default:
            throw new Error("Respuesta inesperada del servidor")
        }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Building2 className="h-7 w-7" />
          Registro de Empresa
        </CardTitle>
        <CardDescription>
          Registre su empresa para participar en la plataforma de vinculación
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-700 text-sm">
              ¡Registro exitoso! Redirigiendo al inicio de sesión...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex gap-2 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Nombre legal de la empresa *</Label>
            <Input
                value={formData.companyName}
                onChange={e => handleChange("companyName", e.target.value)}
                disabled={isLoading}
            />
            {validationErrors.companyName && (
                <p className="text-sm text-red-600">
                {validationErrors.companyName}
                </p>
            )}
            </div>


          <div className="space-y-2">
            <Label>Correo electrónico empresarial *</Label>
            <Input
                type="email"
                value={formData.companyEmail}
                onChange={e => handleChange("companyEmail", e.target.value)}
                disabled={isLoading}
            />
            {validationErrors.companyEmail && (
                <p className="text-sm text-red-600">
                {validationErrors.companyEmail}
                </p>
            )}
        </div>


          <div className="space-y-2">
            <Label>Sector o área de actividad *</Label>
            <Input
                value={formData.sector}
                onChange={e => handleChange("sector", e.target.value)}
                disabled={isLoading}
            />
            {validationErrors.sector && (
                <p className="text-sm text-red-600">
                {validationErrors.sector}
                </p>
            )}
            </div>


          <div className="space-y-2">
            <Label>Descripción general de la empresa *</Label>
            <Textarea
                rows={4}
                value={formData.description}
                onChange={e => handleChange("description", e.target.value)}
                disabled={isLoading}
            />
            {validationErrors.description && (
                <p className="text-sm text-red-600">
                {validationErrors.description}
                </p>
            )}
            </div>


          <div className="space-y-2">
            <Label>Persona de contacto *</Label>
            <Input
                value={formData.contactPerson}
                onChange={e => handleChange("contactPerson", e.target.value)}
                disabled={isLoading}
            />
            {validationErrors.contactPerson && (
                <p className="text-sm text-red-600">
                {validationErrors.contactPerson}
                </p>
            )}
            </div>


          <div className="space-y-2">
            <Label>Contraseña *</Label>
            <Input
                type="password"
                value={formData.password}
                onChange={e => handleChange("password", e.target.value)}
                disabled={isLoading}
            />
            {validationErrors.password && (
                <p className="text-sm text-red-600">
                {validationErrors.password}
                </p>
            )}
            </div>


            <div className="space-y-2">
            <Label>Confirmar contraseña *</Label>
            <Input
                type="password"
                value={formData.confirmPassword}
                onChange={e => handleChange("confirmPassword", e.target.value)}
                disabled={isLoading}
            />
            {validationErrors.confirmPassword && (
                <p className="text-sm text-red-600">
                {validationErrors.confirmPassword}
                </p>
            )}
            </div>

            <div className="space-y-2">
              <Label>Logo de la empresa (PNG/JPG, máximo 2MB)</Label>
              <Input
                type="file"
                name="logo"
                accept="image/png, image/jpeg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleChange("logoFile", e.target.files[0]);
                  }
                }}
                disabled={isLoading}
              />
              {validationErrors.logoFile && (
                <p className="text-sm text-red-600">{validationErrors.logoFile}</p>
              )}
            </div>



          <Button className="w-full h-12" disabled={isLoading || success}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando empresa...
              </>
            ) : (
              "Registrar Empresa"
            )}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}

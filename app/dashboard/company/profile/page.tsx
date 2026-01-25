"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function CompanyProfilePage() {
  const router = useRouter()
  const [company, setCompany] = useState<any>(null)

  useEffect(() => {
    fetch("/api/company/me", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => setCompany(data?.company))
  }, [])

  if (!company) return null

  return (
    <div className="max-w-2xl mx-auto py-8 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute -left-12 top-8"
        onClick={() => router.push("/dashboard/company")}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Perfil de la Empresa</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Nombre Comercial</p>
            <p className="font-medium">{company.name}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Correo Electrónico</p>
            <p className="font-medium">{company.email}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Sector</p>
            <p className="font-medium">{company.sector}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Descripción</p>
            <p className="font-medium">{company.description}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Fecha de Registro</p>
            <p className="font-medium">
              {new Date(company.created_at).toLocaleString("es-CR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Logo</p>
              <div className="flex justify-center mb-4">          
                <img
                  src={company.logo_path}
                  alt={`${company.name} logo`}
                  className="h-24 w-24 object-contain rounded-full border"
                />
            </div>
          </div>
          

          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/company/profile/edit")}
          >
            Editar perfil
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

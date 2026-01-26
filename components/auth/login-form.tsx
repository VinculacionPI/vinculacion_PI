"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginType, setLoginType] = useState<"user" | "company">("user")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("📝 Intentando login como:", loginType);
    console.log("📧 Email:", email);

    const endpoint =
      loginType === "company"
        ? "/api/auth/company-login"
        : "/api/auth/login"

    try {
      console.log("🔗 Llamando a endpoint:", endpoint);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      console.log("📊 Response status:", response.status);
      console.log("📊 Response statusText:", response.statusText);

      const data = await response.json()
      console.log("📊 Response data:", data);

      if (!response.ok) {
        console.error("❌ Login failed:", data);
        throw new Error(data.message || "Error al iniciar sesión")
      }

      console.log("✅ Login exitoso");
      console.log("📊 Data recibida:", data);

      // redirects separados
      if (loginType === "company") {
        console.log("🔄 Redirigiendo a dashboard company");
        router.push("/dashboard/company")
      } else {
        const roleRoutes: Record<string, string> = {
          student: "/dashboard/student",
          graduate: "/dashboard/student",
          admin: "/dashboard/admin",
        }

        const route = roleRoutes[data.role] || "/dashboard/student"
        console.log("🔄 Redirigiendo a:", route);
        router.push(route)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      console.error("❌ Error:", errorMessage);
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credenciales</CardTitle>
        <CardDescription>Ingresa tu email y contraseña</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={loginType === "user" ? "default" : "outline"}
              className="flex-1"
              onClick={() => {
                setLoginType("user")
                setError("")
              }}
              disabled={isLoading}
            >
              Usuario
            </Button>

            <Button
              type="button"
              variant={loginType === "company" ? "default" : "outline"}
              className="flex-1"
              onClick={() => {
                setLoginType("company")
                setError("")
              }}
              disabled={isLoading}
            >
              Empresa
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="flex gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
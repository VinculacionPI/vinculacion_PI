"use client"

import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"
import { Briefcase, Loader2 } from "lucide-react"
import { useRouter } from "next/dist/client/components/navigation"
import { useEffect, useState } from "react"

export default function RegisterPage() {

  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/profile")
        
        if (response.ok) {
          const data = await response.json()
          // User is authenticated, redirect to their dashboard
          if (data.role) {
            router.push(`/dashboard/${data.role.toLowerCase()}`)
            // Keep showing loader during redirect
            return
          }
        }
        // If response is not ok (401), user is not authenticated
        setIsChecking(false)
      } catch (error) {
        // If error, assume not authenticated
        console.error("Auth check error:", error)
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Briefcase className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Vinculación Empresarial EIPI</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Crear Cuenta</h1>
          <p className="text-muted-foreground">Únete a la comunidad TEC</p>
        </div>

        <RegisterForm />

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

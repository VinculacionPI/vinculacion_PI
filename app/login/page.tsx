import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { Briefcase } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Briefcase className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">TEC Empleos</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Iniciar Sesión</h1>
          <p className="text-muted-foreground">Ingresa a tu cuenta para continuar</p>
        </div>

        <LoginForm />

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Regístrate aquí
            </Link>
          </p>
          <p className="mt-2">
            <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

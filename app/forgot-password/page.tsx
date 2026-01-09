import Link from "next/link"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { Briefcase, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Briefcase className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">TEC Empleos</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Recuperar Contraseña</h1>
          <p className="text-muted-foreground">Te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        <ForgotPasswordForm />

        <div className="mt-6">
          <Link href="/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio de sesión
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

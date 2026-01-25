import Link from "next/link"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Briefcase } from "lucide-react"

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Briefcase className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">TEC Empleos</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Restablecer Contraseña</h1>
          <p className="text-muted-foreground">Ingresa tu nueva contraseña</p>
        </div>

        <ResetPasswordForm />
      </div>
    </div>
  )
}

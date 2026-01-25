import Link from "next/link"
import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Briefcase, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function ResetPasswordFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cargando...</CardTitle>
        <CardDescription>Preparando formulario</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
        </div>
      </CardContent>
    </Card>
  )
}

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

        <Suspense fallback={<ResetPasswordFormSkeleton />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}

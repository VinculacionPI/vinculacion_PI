import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function CompanyDashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase()
  
  // Obtener el usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect("/login")
  }

  // Obtener rol desde user_metadata
  const role = user.user_metadata?.role || 'student'
  
  // Verificar que el usuario tenga el rol correcto
  if (role !== "company") {
    redirect(`/dashboard/${role.toLowerCase()}`)
  }

  const userName = user.user_metadata?.name || user.email || "Usuario"
  const userRole = "Empresa"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userName} userRole={userRole} />
      {children}
    </div>
  )
}


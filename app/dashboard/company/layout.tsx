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

  // Obtener datos adicionales del usuario desde la tabla users
  const { data: userData } = await supabase
    .from("USERS")
    .select("name, email, role")
    .eq("id", user.id)
    .single()

  // Verificar que el usuario tenga el rol correcto
  if (userData?.role !== "company") {
    redirect(`/dashboard/${userData?.role || "student"}`)
  }

  const companyName = userData?.name || userData?.email || "Empresa"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={companyName} userRole="Empresa" />
      {children}
    </div>
  )
}

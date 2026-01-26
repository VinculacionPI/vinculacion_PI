import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function GraduateDashboardLayout({ children }: { children: ReactNode }) {
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
  if (userData?.role.toLowerCase() !== "graduate") {
    redirect(`/dashboard/${userData?.role.toLowerCase() || "student"}`)
  }

  const userName = userData?.name || userData?.email || "Usuario"
  const userRole = userData?.role.toLowerCase() || "graduate"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userName} userRole={userRole} />
      {children}
    </div>
  )
}

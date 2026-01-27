import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function CompanyDashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  

  if (error || !user) {
    console.log('No user, redirecting to login')
    redirect("/login")
  }

  // Verificar que sea empresa
  const role = user.user_metadata?.role
  if (role !== "company") {
    console.log('Not company role, redirecting to login')
    redirect("/login")
  }

  // Obtener nombre de la empresa
  const { data: company } = await supabase
    .from('COMPANY')
    .select('name')
    .eq('id', user.user_metadata?.company_id)
    .single()

  console.log('Company loaded:', company?.name)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={company?.name || user.email || 'Empresa'}
        userRole="company"
        userId={user.id}
      />
      {children}
    </div>
  )
}
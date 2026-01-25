import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { createServerSupabase } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function CompanyDashboardLayout({ children }: { children: ReactNode }) {

  const cookieStore = await cookies()
  const session = cookieStore.get("company_session")
  
  if (!session) {
    redirect("/login")
  }

  const company = JSON.parse(session.value)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={company.name}
        userRole="company"
      />
      {children}
    </div>
  )
}


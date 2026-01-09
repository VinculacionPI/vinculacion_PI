import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/shared/dashboard-header"

export default function GraduateDashboardLayout({ children }: { children: ReactNode }) {
  // TODO: Get user data from auth context/session
  const userName = "María González"
  const userRole = "Graduado"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userName} userRole={userRole} />
      {children}
    </div>
  )
}

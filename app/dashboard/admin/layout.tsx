import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/shared/dashboard-header"

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  // TODO: Get admin data from auth context/session
  const userName = "Admin TEC"
  const userRole = "Administrador"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userName} userRole={userRole} />
      {children}
    </div>
  )
}

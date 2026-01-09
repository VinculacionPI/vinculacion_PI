import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/shared/dashboard-header"

export default function StudentDashboardLayout({ children }: { children: ReactNode }) {
  // TODO: Get user data from auth context/session
  const userName = "Juan Pérez"
  const userRole = "Estudiante"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userName} userRole={userRole} />
      {children}
    </div>
  )
}

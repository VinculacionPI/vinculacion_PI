import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/shared/dashboard-header"

export default function CompanyDashboardLayout({ children }: { children: ReactNode }) {
  // TODO: Get company data from auth context/session
  const userName = "Tech Solutions CR"
  const userRole = "Empresa"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={userName} userRole={userRole} />
      {children}
    </div>
  )
}

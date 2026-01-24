"use client"

import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/shared/dashboard-header"

export default function CompanyDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName="IBM Test" userRole="Empresa" />
      {children}
    </div>
  )
}



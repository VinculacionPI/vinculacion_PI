"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/shared/dashboard-header"
import { supabase } from "@/lib/supabase"

export default function CompanyDashboardLayout({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const [companyName, setCompanyName] = useState("Empresa")

  useEffect(() => {
    const empresaId = searchParams.get('empresa_id')
    if (empresaId) {
      loadCompanyName(empresaId)
    }
  }, [searchParams])

  const loadCompanyName = async (empresaId: string) => {
    try {
      const { data, error } = await supabase
        .from('COMPANY')
        .select('name')
        .eq('id', empresaId)
        .single()

      if (data) {
        setCompanyName(data.name)
      }
    } catch (err) {
      console.error('Error cargando empresa:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={companyName} userRole="Empresa" />
      {children}
    </div>
  )
}

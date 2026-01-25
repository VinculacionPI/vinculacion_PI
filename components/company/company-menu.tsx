"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LogOut, Building2 } from "lucide-react"

export function CompanyMenu() {
  const router = useRouter()
  const [company, setCompany] = useState<any>(null)

  useEffect(() => {
    fetch("/api/company/me", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => setCompany(data?.company))
  }, [])

  if (!company) return null

  const initials = company.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()

  const logout = async () => {
    await fetch("/api/company/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 w-9 rounded-full p-0 font-semibold"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {initials}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold">{company.name}</p>
          <p className="text-xs text-muted-foreground">{company.email}</p>
        </div>

        <DropdownMenuItem onClick={() => router.push("/dashboard/company/profile")}>
            <Building2 className="mr-2 h-4 w-4" />
            Ver perfil
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-destructive"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

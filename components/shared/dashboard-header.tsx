"use client"

import { Button } from "@/components/ui/button"
import { Briefcase, LogOut, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/notifications/notification-bell"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface DashboardHeaderProps {
  userName?: string
  userRole?: string
}

export function DashboardHeader({ userName = "Usuario", userRole = "Estudiante" }: DashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    router.push("/login")
  }

  // Determine home link based on login status
  const homeLink = userRole ? `/dashboard/${userRole.toLowerCase()}` : "/"

  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={homeLink} className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-foreground">TEC Empleos</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Instituto Tecnológico de Costa Rica</p>
          </div>
        </Link>
      </div>
    </header>
  )
}
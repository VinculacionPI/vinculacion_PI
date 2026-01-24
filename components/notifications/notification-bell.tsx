"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { NotificationList } from "./notification-list"
import { supabase } from "@/lib/supabase"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUserAndNotifications()
  }, [])

  const loadUserAndNotifications = async () => {
    // Por ahora usamos un usuario de prueba
    // En producción esto vendría de la sesión autenticada
    const testUserId = '3d146d09-c6ae-4dbe-b4e3-7045a5e1964a'
    setUserId(testUserId)
    await loadNotifications(testUserId)
  }

  const loadNotifications = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('NOTIFICATION')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!userId) return

    try {
      await supabase
        .from('NOTIFICATION')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      await loadNotifications(userId)
    } catch (error) {
      console.error('Error marcando como leídas:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('NOTIFICATION')
        .update({ read: true })
        .eq('id', notificationId)

      if (userId) await loadNotifications(userId)
    } catch (error) {
      console.error('Error marcando notificación:', error)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationList
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          unreadCount={unreadCount}
        />
      </PopoverContent>
    </Popover>
  )
}
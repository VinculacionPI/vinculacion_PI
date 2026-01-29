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
import { getCurrentUser } from "@/lib/auth/get-current-user"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUserAndNotifications()
    
    // Recargar cada 30 segundos
    const interval = setInterval(loadUserAndNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadUserAndNotifications = async () => {
    const user = await getCurrentUser()
    
    if (!user?.id) {
      console.warn('No hay usuario autenticado')
      return
    }

    setUserId(user.id)
    await loadNotifications(user.id)
  }

  const loadNotifications = async (uid: string) => {
    try {
      console.log('Cargando notificaciones para:', uid)
      
      const { data, error } = await supabase
        .from('NOTIFICATION')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error:', error)
        throw error
      }

      console.log('Notificaciones encontradas:', data?.length || 0)
      
      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!userId) return

    try {
      await supabase
        .from('NOTIFICATION')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false)

      await loadNotifications(userId)
    } catch (error) {
      console.error('Error marcando como leídas:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('NOTIFICATION')
        .update({ is_read: true, read_at: new Date().toISOString() })
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
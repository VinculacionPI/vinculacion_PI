"use client"

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { useRouter } from 'next/navigation'

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
    
    // Recargar cada 30 segundos
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

async function loadNotifications() {
  const user = await getCurrentUser()
  if (!user) return

  const { data } = await supabase
    .from('NOTIFICATION')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (data) {
    setNotifications(data)
    setUnreadCount(data.filter(n => !n.is_read).length)
  }
}

  async function markAsRead(notification: any) {
    await supabase
      .from('NOTIFICATION')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notification.id)
    
    loadNotifications()
    
    // Redirigir si tiene entidad relacionada
    if (notification.entity_type === 'opportunity' && notification.entity_id) {
      router.push(`/opportunities/${notification.entity_id}`)
    }
    
    setIsOpen(false)
  }

  async function markAllAsRead() {
    const user = await getCurrentUser()
    if (!user) return

    await supabase
      .from('NOTIFICATION')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)
    
    loadNotifications()
  }

  async function deleteNotification(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    
    await supabase
      .from('NOTIFICATION')
      .delete()
      .eq('id', id)
    
    loadNotifications()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              Marcar todas
            </Button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No tienes notificaciones</p>
          </div>
        ) : (
          <>
            {notifications.map(notif => (
              <DropdownMenuItem 
                key={notif.id}
                onClick={() => markAsRead(notif)}
                className={`cursor-pointer p-3 flex items-start gap-3 ${!notif.is_read ? 'bg-accent/50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm leading-tight">{notif.title}</p>
                    {!notif.is_read && (
                      <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.created_at).toLocaleDateString('es-CR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CheckCheck, Briefcase, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"

interface NotificationListProps {
  notifications: any[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  unreadCount: number
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  unreadCount,
}: NotificationListProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'NUEVO_INTERES':
        return <Briefcase className="h-4 w-4 text-blue-500" />
      case 'CAMBIO_ESTADO':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'NUEVA_PUBLICACION':
        return <FileText className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getLink = (notification: any) => {
    const payload = notification.payload || {}
    
    if (payload.publicacion_id) {
      return `/opportunities/${payload.publicacion_id}`
    }
    
    return '#'
  }

  return (
    <div className="flex flex-col h-[400px]">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onMarkAllAsRead}
              className="h-auto p-0 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No tienes notificaciones
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-accent transition-colors ${
                  !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                }`}
              >
                <Link
                  href={getLink(notification)}
                  onClick={() => !notification.read && onMarkAsRead(notification.id)}
                  className="flex gap-3"
                >
                  <div className="mt-1 flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.payload?.titulo || 'Notificación'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.payload?.contenido || 'Sin descripción'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString('es-CR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCheck, Briefcase, FileText, AlertCircle, Building2, GraduationCap } from "lucide-react"

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
      case 'NEW_OPPORTUNITY':
        return <Briefcase className="h-4 w-4 text-blue-500" />
      case 'PENDING_APPROVAL':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'PENDING_COMPANY_APPROVAL':
        return <Building2 className="h-4 w-4 text-purple-500" />
      case 'PENDING_GRADUATION':
        return <GraduationCap className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const handleNotificationClick = (notification: any) => {
    // Marcar como leída
    if (!notification.is_read) {
      onMarkAsRead(notification.id)
    }

    // Solo navegar si es una oportunidad para estudiantes/graduados
    if (notification.type === 'NEW_OPPORTUNITY' && 
        notification.entity_type === 'opportunity' && 
        notification.entity_id) {
      window.location.href = `/opportunities/${notification.entity_id}`
    }
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
                className={`p-4 hover:bg-accent transition-colors cursor-pointer ${
                  !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.title || 'Notificación'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message || 'Sin descripción'}
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
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
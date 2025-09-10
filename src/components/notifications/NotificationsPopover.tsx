import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, BellRing, Check, Trash2 } from 'lucide-react'
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications,
  getNotificationIcon,
  getNotificationTypeColor,
  type Notification,
  type NotificationSubscription
} from '@/services/notificationService'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const handleMarkAsRead = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
  }

  const handleDelete = () => {
    onDelete(notification.id)
  }

  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        notification.read 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                notification.read ? 'text-gray-600' : 'text-gray-900'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${
                notification.read ? 'text-gray-500' : 'text-gray-700'
              }`}>
                {notification.message}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getNotificationTypeColor(notification.type)}`}
                >
                  {notification.type.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: fr
                  })}
                </span>
              </div>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-3">
            {!notification.read && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAsRead}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Marquer comme lu
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationsDropdown() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const data = await getUserNotifications(user.id, 50)
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    } catch (err) {
      toast.error('Erreur lors du chargement des notifications')
      console.error('Error loading notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    let subscription: NotificationSubscription | null = null

    const initializeNotifications = async () => {
      await loadNotifications()

      subscription = subscribeToNotifications(user.id, (newNotification) => {
        setNotifications(prev => [newNotification, ...prev])
        setUnreadCount(prev => prev + 1)
      })
    }

    initializeNotifications()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [user, loadNotifications])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      toast.error('Erreur lors de la mise à jour de la notification')
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user) return

    try {
      await markAllNotificationsAsRead(user.id)
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
      toast.success('Toutes les notifications ont été marquées comme lues')
    } catch (err) {
      toast.error('Erreur lors de la mise à jour des notifications')
      console.error('Error marking all notifications as read:', err)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      const deletedNotification = notifications.find(n => n.id === notificationId)
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      toast.success('Notification supprimée')
    } catch (err) {
      toast.error('Erreur lors de la suppression de la notification')
      console.error('Error deleting notification:', err)
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read)
  const readNotifications = notifications.filter(n => n.read)

  if (!user) return null

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <Card className="w-96 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Tout marquer comme lu
                  </Button>
                )}
              </div>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">
                  {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <Bell className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">Aucune notification</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-3">
                    {/* Unread notifications first */}
                    {unreadNotifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                      />
                    ))}
                    
                    {/* Read notifications */}
                    {unreadNotifications.length > 0 && readNotifications.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs text-gray-500 mb-2 px-1">Notifications lues</p>
                      </div>
                    )}
                    
                    {readNotifications.slice(0, 10).map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

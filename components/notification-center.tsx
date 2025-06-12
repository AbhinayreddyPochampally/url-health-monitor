"use client"

import { useState, useEffect } from "react"
import { Bell, X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  timestamp: string
  read: boolean
  url?: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case "info":
        return <Info className="w-4 h-4 text-blue-400" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-green-500/30 bg-green-900/20"
      case "error":
        return "border-red-500/30 bg-red-900/20"
      case "warning":
        return "border-yellow-500/30 bg-yellow-900/20"
      case "info":
        return "border-blue-500/30 bg-blue-900/20"
      default:
        return "border-gray-500/30 bg-gray-900/20"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 text-white border-0"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 glass border-gray-600/30" align="end">
        <Card className="border-0 bg-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  onClick={clearAll}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  Clear all
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      getTypeColor(notification.type)
                    } ${!notification.read ? 'ring-1 ring-blue-500/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-300 mt-1">
                              {notification.message}
                            </p>
                            {notification.url && (
                              <p className="text-xs text-blue-400 mt-1 truncate">
                                {notification.url}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                onClick={() => markAsRead(notification.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              onClick={() => removeNotification(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
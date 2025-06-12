"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, RefreshCw, Globe, Clock, TrendingUp, ChevronDown, ChevronUp, Settings, Bell, Search, Filter, Download, Upload, Trash2, Eye, EyeOff, Zap, Activity, Shield, AlertTriangle, CheckCircle, XCircle, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { UrlMetrics } from "@/components/url-metrics"
import { NotificationCenter } from "@/components/notification-center"
import { RealTimeChart } from "@/components/real-time-chart"
import { MobileOptimizedView } from "@/components/mobile-optimized-view"
import { useToast } from "@/hooks/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useRealTimeMonitoring } from "@/hooks/use-real-time-monitoring"

interface HistoricalCheck {
  timestamp: string
  status: "UP" | "DOWN"
  responseTime: number | null
}

interface UrlCheck {
  id: string
  url: string
  status: "UP" | "DOWN" | "CHECKING"
  responseTime: number | null
  lastChecked: string
  history: HistoricalCheck[]
  uptime: number
  isEnabled: boolean
  checkInterval: number
  tags: string[]
  priority: "low" | "medium" | "high" | "critical"
  notifications: boolean
  lastNotification?: string
}

interface MonitoringSettings {
  autoRefresh: boolean
  refreshInterval: number
  soundNotifications: boolean
  emailNotifications: boolean
  theme: "dark" | "light" | "auto"
  compactView: boolean
}

const MAX_HISTORY_ENTRIES = 1000
const DEFAULT_CHECK_INTERVAL = 300000 // 5 minutes

export default function UrlHealthMonitor() {
  const [urls, setUrls] = useLocalStorage<UrlCheck[]>("url-monitor-data", [])
  const [newUrl, setNewUrl] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [bulkUrls, setBulkUrls] = useState("")
  const [showBulkInput, setShowBulkInput] = useState(false)
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "up" | "down" | "checking">("all")
  const [filterPriority, setFilterPriority] = useState<"all" | "low" | "medium" | "high" | "critical">("all")
  const [sortBy, setSortBy] = useState<"name" | "status" | "uptime" | "responseTime" | "lastChecked">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [showSettings, setShowSettings] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  
  const [settings, setSettings] = useLocalStorage<MonitoringSettings>("monitor-settings", {
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
    soundNotifications: true,
    emailNotifications: false,
    theme: "dark",
    compactView: false
  })

  const { toast } = useToast()
  const checkingRef = useRef<Set<string>>(new Set())
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null)

  // Real-time monitoring hook
  const { isMonitoring, startMonitoring, stopMonitoring, monitoringStats } = useRealTimeMonitoring({
    urls: urls.filter(url => url.isEnabled),
    onStatusChange: handleStatusChange,
    interval: settings.refreshInterval
  })

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Initialize notification audio
  useEffect(() => {
    notificationAudioRef.current = new Audio('/notification.mp3')
    notificationAudioRef.current.volume = 0.5
  }, [])

  // Auto-start monitoring when enabled
  useEffect(() => {
    if (settings.autoRefresh && urls.length > 0 && isOnline) {
      startMonitoring()
    } else {
      stopMonitoring()
    }
    
    return () => stopMonitoring()
  }, [settings.autoRefresh, urls.length, isOnline, startMonitoring, stopMonitoring])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timeoutId = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timeoutId)
    }
  }, [error])

  // Handle status changes from real-time monitoring
  function handleStatusChange(urlId: string, oldStatus: string, newStatus: string, responseTime: number | null) {
    setUrls(prev => prev.map(url => {
      if (url.id === urlId) {
        const newHistoryEntry: HistoricalCheck = {
          timestamp: new Date().toISOString(),
          status: newStatus as "UP" | "DOWN",
          responseTime
        }

        const updatedHistory = [...url.history, newHistoryEntry].slice(-MAX_HISTORY_ENTRIES)
        const totalChecks = updatedHistory.length
        const successfulChecks = updatedHistory.filter(check => check.status === "UP").length
        const uptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0

        // Send notification if status changed and notifications are enabled
        if (oldStatus !== newStatus && url.notifications) {
          sendNotification(url.url, newStatus as "UP" | "DOWN", responseTime)
        }

        return {
          ...url,
          status: newStatus as "UP" | "DOWN" | "CHECKING",
          responseTime,
          lastChecked: new Date().toISOString(),
          history: updatedHistory,
          uptime,
          lastNotification: oldStatus !== newStatus ? new Date().toISOString() : url.lastNotification
        }
      }
      return url
    }))
  }

  // Send notification
  const sendNotification = useCallback((url: string, status: "UP" | "DOWN", responseTime: number | null) => {
    const title = status === "UP" ? "✅ Site is back online!" : "🚨 Site is down!"
    const body = `${url} is now ${status.toLowerCase()}${responseTime ? ` (${responseTime}ms)` : ""}`

    // Browser notification
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" })
    }

    // Sound notification
    if (settings.soundNotifications && notificationAudioRef.current) {
      notificationAudioRef.current.play().catch(() => {
        // Ignore audio play errors
      })
    }

    // Toast notification
    toast({
      title,
      description: body,
      variant: status === "DOWN" ? "destructive" : "default"
    })
  }, [settings.soundNotifications, toast])

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const addUrl = useCallback(() => {
    if (!newUrl.trim()) return

    try {
      const urlObj = new URL(newUrl)
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        setError("URL must use HTTP or HTTPS protocol")
        return
      }
    } catch {
      setError("Please enter a valid URL")
      return
    }

    if (urls.some((url) => url.url === newUrl)) {
      setError("URL already exists")
      return
    }

    const newUrlCheck: UrlCheck = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: newUrl,
      status: "CHECKING",
      responseTime: null,
      lastChecked: new Date().toISOString(),
      history: [],
      uptime: 0,
      isEnabled: true,
      checkInterval: DEFAULT_CHECK_INTERVAL,
      tags: [],
      priority: "medium",
      notifications: true
    }

    setUrls((prev) => [newUrlCheck, ...prev])
    setNewUrl("")
    setError(null)
    
    toast({
      title: "URL Added",
      description: `${newUrl} has been added to monitoring`
    })
  }, [newUrl, urls, setUrls, toast])

  const addBulkUrls = useCallback(() => {
    if (!bulkUrls.trim()) return

    const urlList = bulkUrls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0)

    if (urlList.length === 0) {
      setError("No valid URLs found")
      return
    }

    if (urlList.length > 50) {
      setError("Maximum 50 URLs can be added at once")
      return
    }

    const validUrls: UrlCheck[] = []
    const invalidUrls: string[] = []

    urlList.forEach((url) => {
      try {
        const urlObj = new URL(url)
        if (!["http:", "https:"].includes(urlObj.protocol)) {
          invalidUrls.push(url)
          return
        }

        if (!urls.some((existingUrl) => existingUrl.url === url)) {
          validUrls.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url,
            status: "CHECKING",
            responseTime: null,
            lastChecked: new Date().toISOString(),
            history: [],
            uptime: 0,
            isEnabled: true,
            checkInterval: DEFAULT_CHECK_INTERVAL,
            tags: [],
            priority: "medium",
            notifications: true
          })
        }
      } catch {
        invalidUrls.push(url)
      }
    })

    if (invalidUrls.length > 0) {
      setError(`Invalid URLs found: ${invalidUrls.slice(0, 5).join(", ")}${invalidUrls.length > 5 ? "..." : ""}`)
    }

    if (validUrls.length > 0) {
      setUrls((prev) => [...validUrls, ...prev])
      setBulkUrls("")
      setShowBulkInput(false)
      setError(null)
      
      toast({
        title: "Bulk URLs Added",
        description: `${validUrls.length} URLs have been added to monitoring`
      })
    }
  }, [bulkUrls, urls, setUrls, toast])

  const checkSingleUrl = useCallback(async (id: string, url: string) => {
    if (checkingRef.current.has(id)) return

    checkingRef.current.add(id)

    try {
      setUrls((prev) => prev.map((urlCheck) => 
        urlCheck.id === id ? { ...urlCheck, status: "CHECKING" as const } : urlCheck
      ))

      const response = await fetch("/api/check-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      setUrls((prev) => prev.map((urlCheck) => {
        if (urlCheck.id === id) {
          const newHistoryEntry: HistoricalCheck = {
            timestamp: new Date().toISOString(),
            status: result.status,
            responseTime: result.responseTime,
          }

          const updatedHistory = [...urlCheck.history, newHistoryEntry].slice(-MAX_HISTORY_ENTRIES)
          const totalChecks = updatedHistory.length
          const successfulChecks = updatedHistory.filter((check) => check.status === "UP").length
          const uptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0

          return {
            ...urlCheck,
            status: result.status,
            responseTime: result.responseTime,
            lastChecked: new Date().toISOString(),
            history: updatedHistory,
            uptime,
          }
        }
        return urlCheck
      }))
    } catch (error) {
      console.error("Error checking URL:", error)
      
      setUrls((prev) => prev.map((urlCheck) => {
        if (urlCheck.id === id) {
          const newHistoryEntry: HistoricalCheck = {
            timestamp: new Date().toISOString(),
            status: "DOWN",
            responseTime: null,
          }

          const updatedHistory = [...urlCheck.history, newHistoryEntry].slice(-MAX_HISTORY_ENTRIES)
          const totalChecks = updatedHistory.length
          const successfulChecks = updatedHistory.filter((check) => check.status === "UP").length
          const uptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0

          return {
            ...urlCheck,
            status: "DOWN" as const,
            responseTime: null,
            lastChecked: new Date().toISOString(),
            history: updatedHistory,
            uptime,
          }
        }
        return urlCheck
      }))
    } finally {
      checkingRef.current.delete(id)
    }
  }, [setUrls])

  const checkAllUrls = useCallback(async () => {
    if (isChecking || urls.length === 0) return

    setIsChecking(true)
    setError(null)

    try {
      const enabledUrls = urls.filter(url => url.isEnabled)
      
      setUrls((prev) => prev.map((url) => 
        url.isEnabled ? { ...url, status: "CHECKING" as const } : url
      ))

      const batchSize = 5
      for (let i = 0; i < enabledUrls.length; i += batchSize) {
        const batch = enabledUrls.slice(i, i + batchSize)
        const promises = batch.map((url) => checkSingleUrl(url.id, url.url))
        await Promise.all(promises)

        if (i + batchSize < enabledUrls.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
      
      toast({
        title: "Check Complete",
        description: `Checked ${enabledUrls.length} URLs`
      })
    } catch (error) {
      console.error("Error checking all URLs:", error)
      setError("Failed to check some URLs. Please try again.")
    } finally {
      setIsChecking(false)
    }
  }, [isChecking, urls, checkSingleUrl, setUrls, toast])

  const removeUrl = useCallback((id: string) => {
    setUrls((prev) => prev.filter((url) => url.id !== id))
    setSelectedUrls(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    checkingRef.current.delete(id)
    
    toast({
      title: "URL Removed",
      description: "URL has been removed from monitoring"
    })
  }, [setUrls, toast])

  const toggleUrlEnabled = useCallback((id: string) => {
    setUrls(prev => prev.map(url => 
      url.id === id ? { ...url, isEnabled: !url.isEnabled } : url
    ))
  }, [setUrls])

  const updateUrlSettings = useCallback((id: string, updates: Partial<UrlCheck>) => {
    setUrls(prev => prev.map(url => 
      url.id === id ? { ...url, ...updates } : url
    ))
  }, [setUrls])

  // Filter and sort URLs
  const filteredAndSortedUrls = urls
    .filter(url => {
      const matchesSearch = url.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           url.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = filterStatus === "all" || url.status.toLowerCase() === filterStatus
      const matchesPriority = filterPriority === "all" || url.priority === filterPriority
      
      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case "name":
          comparison = a.url.localeCompare(b.url)
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
        case "uptime":
          comparison = a.uptime - b.uptime
          break
        case "responseTime":
          comparison = (a.responseTime || 0) - (b.responseTime || 0)
          break
        case "lastChecked":
          comparison = new Date(a.lastChecked).getTime() - new Date(b.lastChecked).getTime()
          break
      }
      
      return sortOrder === "asc" ? comparison : -comparison
    })

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "UP":
        return "status-up"
      case "DOWN":
        return "status-down"
      case "CHECKING":
        return "status-checking"
      default:
        return "bg-gray-800 text-gray-400 border-gray-600"
    }
  }, [])

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-900/50 text-red-400 border-red-600"
      case "high":
        return "bg-orange-900/50 text-orange-400 border-orange-600"
      case "medium":
        return "bg-yellow-900/50 text-yellow-400 border-yellow-600"
      case "low":
        return "bg-green-900/50 text-green-400 border-green-600"
      default:
        return "bg-gray-900/50 text-gray-400 border-gray-600"
    }
  }, [])

  const toggleUrlExpansion = useCallback((url: string) => {
    setExpandedUrl((prev) => (prev === url ? null : url))
  }, [])

  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(urls, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `url-monitor-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Data Exported",
      description: "Your monitoring data has been exported"
    })
  }, [urls, toast])

  const importData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        if (Array.isArray(importedData)) {
          setUrls(importedData)
          toast({
            title: "Data Imported",
            description: `Imported ${importedData.length} URLs`
          })
        } else {
          throw new Error("Invalid file format")
        }
      } catch (error) {
        setError("Failed to import data. Please check the file format.")
      }
    }
    reader.readAsText(file)
    
    // Reset the input
    event.target.value = ""
  }, [setUrls, toast])

  // Calculate stats
  const stats = {
    total: urls.length,
    enabled: urls.filter(url => url.isEnabled).length,
    up: urls.filter((url) => url.status === "UP").length,
    down: urls.filter((url) => url.status === "DOWN").length,
    checking: urls.filter((url) => url.status === "CHECKING").length,
    avgResponseTime: urls.filter((url) => url.responseTime).length > 0
      ? Math.round(
          urls.filter((url) => url.responseTime).reduce((acc, url) => acc + (url.responseTime || 0), 0) /
            urls.filter((url) => url.responseTime).length,
        )
      : 0,
    avgUptime: urls.length > 0 
      ? Math.round(urls.reduce((acc, url) => acc + url.uptime, 0) / urls.length)
      : 0
  }

  if (isMobile) {
    return (
      <MobileOptimizedView
        urls={filteredAndSortedUrls}
        stats={stats}
        isMonitoring={isMonitoring}
        isOnline={isOnline}
        onAddUrl={addUrl}
        onCheckUrl={checkSingleUrl}
        onRemoveUrl={removeUrl}
        onToggleEnabled={toggleUrlEnabled}
        onToggleExpansion={toggleUrlExpansion}
        expandedUrl={expandedUrl}
        newUrl={newUrl}
        setNewUrl={setNewUrl}
        error={error}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        settings={settings}
        setSettings={setSettings}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Globe className="w-8 h-8 text-blue-400" />
                {isMonitoring && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse-glow" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">URL Monitor Pro</h1>
                <p className="text-gray-300 flex items-center gap-2">
                  Professional website health monitoring
                  {!isOnline && (
                    <Badge variant="destructive" className="animate-pulse">
                      <WifiOff className="w-3 h-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                {isMonitoring ? 'Real-time monitoring active' : 'Monitoring paused'}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <NotificationCenter />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="glass rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400">Total URLs</div>
            </div>
            <div className="glass rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.up}</div>
              <div className="text-xs text-gray-400">Online</div>
            </div>
            <div className="glass rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.down}</div>
              <div className="text-xs text-gray-400">Offline</div>
            </div>
            <div className="glass rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.avgResponseTime}ms</div>
              <div className="text-xs text-gray-400">Avg Response</div>
            </div>
            <div className="glass rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.avgUptime}%</div>
              <div className="text-xs text-gray-400">Avg Uptime</div>
            </div>
            <div className="glass rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.enabled}</div>
              <div className="text-xs text-gray-400">Enabled</div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="glass rounded-lg p-4 border-red-500/50 bg-red-900/20 animate-bounce-in">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <Card className="glass border-blue-500/30 animate-slide-up">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Monitoring Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Auto Refresh</label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.autoRefresh}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, autoRefresh: checked }))
                      }
                    />
                    <span className="text-sm text-gray-400">
                      {settings.autoRefresh ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Refresh Interval</label>
                  <Select
                    value={settings.refreshInterval.toString()}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, refreshInterval: parseInt(value) }))
                    }
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60000">1 minute</SelectItem>
                      <SelectItem value="300000">5 minutes</SelectItem>
                      <SelectItem value="600000">10 minutes</SelectItem>
                      <SelectItem value="1800000">30 minutes</SelectItem>
                      <SelectItem value="3600000">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Sound Notifications</label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.soundNotifications}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, soundNotifications: checked }))
                      }
                    />
                    <span className="text-sm text-gray-400">
                      {settings.soundNotifications ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Compact View</label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.compactView}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, compactView: checked }))
                      }
                    />
                    <span className="text-sm text-gray-400">
                      {settings.compactView ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real-time Chart */}
        {isMonitoring && monitoringStats && (
          <RealTimeChart data={monitoringStats} />
        )}

        {/* Controls */}
        <Tabs defaultValue="monitor" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="monitor" className="data-[state=active]:bg-blue-600">
              <Activity className="w-4 h-4 mr-2" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-blue-600">
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="space-y-6">
            {/* Add URL Form */}
            <Card className="glass border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-green-400" />
                    Add URLs to Monitor
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowBulkInput(!showBulkInput)}
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                    >
                      {showBulkInput ? "Single URL" : "Bulk Add"}
                    </Button>
                    <Button
                      onClick={exportData}
                      variant="outline"
                      size="sm"
                      className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <label className="cursor-pointer">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                        asChild
                      >
                        <span>
                          <Upload className="w-4 h-4" />
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importData}
                        className="hidden"
                      />
                    </label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showBulkInput ? (
                  <div className="flex gap-4">
                    <Input
                      placeholder="https://example.com"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addUrl()}
                      className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus-enhanced"
                    />
                    <Button 
                      onClick={addUrl} 
                      className="btn-primary mobile-button"
                      disabled={!newUrl.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add URL
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea
                      placeholder="Enter multiple URLs (one per line):&#10;https://google.com&#10;https://github.com&#10;https://stackoverflow.com"
                      value={bulkUrls}
                      onChange={(e) => setBulkUrls(e.target.value)}
                      rows={6}
                      className="w-full bg-gray-800/50 border border-gray-600 rounded-lg p-3 text-white placeholder:text-gray-400 focus:border-blue-400 resize-none focus-enhanced"
                    />
                    <div className="flex gap-4">
                      <Button 
                        onClick={addBulkUrls} 
                        className="btn-primary"
                        disabled={!bulkUrls.trim()}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add All URLs
                      </Button>
                      <Button
                        onClick={() => setBulkUrls("")}
                        variant="outline"
                        className="border-gray-600 text-gray-400 hover:bg-gray-700"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={checkAllUrls}
                      disabled={isChecking || urls.filter(url => url.isEnabled).length === 0}
                      variant="outline"
                      className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white mobile-button"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
                      Check All ({urls.filter(url => url.isEnabled).length})
                    </Button>
                    
                    <Button
                      onClick={() => settings.autoRefresh ? stopMonitoring() : startMonitoring()}
                      variant="outline"
                      className={`mobile-button ${isMonitoring 
                        ? 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white' 
                        : 'border-green-600 text-green-400 hover:bg-green-600 hover:text-white'
                      }`}
                      disabled={!isOnline}
                    >
                      {isMonitoring ? (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Stop Monitoring
                        </>
                      ) : (
                        <>
                          <Activity className="w-4 h-4 mr-2" />
                          Start Monitoring
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {selectedUrls.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        {selectedUrls.size} selected
                      </span>
                      <Button
                        onClick={() => {
                          selectedUrls.forEach(id => removeUrl(id))
                          setSelectedUrls(new Set())
                        }}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Filters and Search */}
            <Card className="glass border-gray-600/30">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search URLs or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32 bg-gray-800/50 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="up">Up</SelectItem>
                        <SelectItem value="down">Down</SelectItem>
                        <SelectItem value="checking">Checking</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-32 bg-gray-800/50 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-32 bg-gray-800/50 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="uptime">Uptime</SelectItem>
                        <SelectItem value="responseTime">Response</SelectItem>
                        <SelectItem value="lastChecked">Last Check</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-400 hover:bg-gray-700"
                    >
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* URL List */}
            <Card className="glass border-gray-600/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  Monitored URLs
                  {filteredAndSortedUrls.length > 0 && (
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600 ml-2">
                      {filteredAndSortedUrls.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredAndSortedUrls.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Globe className="w-16 h-16 mx-auto mb-4 text-blue-400/50" />
                    <p className="text-lg">
                      {urls.length === 0 ? "No URLs being monitored" : "No URLs match your filters"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {urls.length === 0 ? "Add your first URL to get started" : "Try adjusting your search or filters"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAndSortedUrls.map((url, index) => (
                      <div 
                        key={url.id} 
                        className="glass rounded-lg overflow-hidden card-hover animate-slide-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedUrls.has(url.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedUrls)
                                if (e.target.checked) {
                                  newSet.add(url.id)
                                } else {
                                  newSet.delete(url.id)
                                }
                                setSelectedUrls(newSet)
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                            />
                            
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full flex-shrink-0 ${getStatusColor(url.status)}`} />
                              <Switch
                                checked={url.isEnabled}
                                onCheckedChange={() => toggleUrlEnabled(url.id)}
                                size="sm"
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0 max-w-md">
                              <div className="flex items-center gap-2 mb-1">
                                <p 
                                  className="font-medium text-white truncate cursor-pointer hover:text-blue-400 transition-colors" 
                                  title={url.url}
                                  onClick={() => toggleUrlExpansion(url.url)}
                                >
                                  {url.url}
                                </p>
                                <Badge className={getPriorityColor(url.priority)} size="sm">
                                  {url.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>Last checked: {new Date(url.lastChecked).toLocaleTimeString()}</span>
                                {url.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {url.tags.slice(0, 2).map(tag => (
                                      <Badge key={tag} variant="outline" size="sm" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {url.tags.length > 2 && (
                                      <Badge variant="outline" size="sm" className="text-xs">
                                        +{url.tags.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {url.responseTime && (
                              <div className="text-right hidden sm:block">
                                <p className="text-xs text-gray-400">Response</p>
                                <p className="font-medium text-blue-400 text-sm">{url.responseTime}ms</p>
                              </div>
                            )}

                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-gray-400">Uptime</p>
                              <div className="flex items-center gap-1">
                                <Progress 
                                  value={url.uptime} 
                                  className="w-12 h-2"
                                />
                                <p className="font-medium text-green-400 text-sm w-12">
                                  {url.uptime.toFixed(1)}%
                                </p>
                              </div>
                            </div>

                            <Badge className={getStatusColor(url.status)} size="sm">
                              {url.status === "UP" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {url.status === "DOWN" && <XCircle className="w-3 h-3 mr-1" />}
                              {url.status === "CHECKING" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                              {url.status}
                            </Badge>

                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                checkSingleUrl(url.id, url.url)
                              }}
                              variant="outline"
                              size="sm"
                              disabled={url.status === "CHECKING" || !url.isEnabled}
                              className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white mobile-button"
                            >
                              <RefreshCw className={`w-3 h-3 ${url.status === "CHECKING" ? "animate-spin" : ""}`} />
                              <span className="hidden md:inline ml-1">Check</span>
                            </Button>

                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeUrl(url.id)
                              }}
                              variant="outline"
                              size="sm"
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white mobile-button"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="hidden md:inline ml-1">Remove</span>
                            </Button>

                            <Button
                              onClick={() => toggleUrlExpansion(url.url)}
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white mobile-button"
                            >
                              {expandedUrl === url.url ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded metrics view */}
                        {expandedUrl === url.url && (
                          <div className="border-t border-gray-600/50 animate-slide-up">
                            <UrlMetrics
                              url={url.url}
                              history={url.history}
                              uptime={url.uptime}
                              urlData={url}
                              onCheckHealth={(urlToCheck) => checkSingleUrl(url.id, urlToCheck)}
                              onUpdateSettings={(updates) => updateUrlSettings(url.id, updates)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Analytics content will be implemented here */}
              <Card className="glass border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Analytics Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-400">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-blue-400/50" />
                    <p className="text-lg">Analytics Dashboard</p>
                    <p className="text-sm text-gray-500">Coming soon - Advanced analytics and reporting</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="manage">
            <div className="space-y-6">
              {/* Management content will be implemented here */}
              <Card className="glass border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-400" />
                    URL Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-400">
                    <Settings className="w-16 h-16 mx-auto mb-4 text-blue-400/50" />
                    <p className="text-lg">URL Management</p>
                    <p className="text-sm text-gray-500">Bulk operations and advanced management tools</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Clock, Calendar, Zap, Activity, Shield, RefreshCw, History, Settings, Bell, Tag, AlertTriangle } from "lucide-react"

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

interface UrlMetricsProps {
  url: string
  history: HistoricalCheck[]
  uptime: number
  urlData: UrlCheck
  onCheckHealth?: (url: string) => Promise<void>
  onUpdateSettings?: (updates: Partial<UrlCheck>) => void
}

export function UrlMetrics({ url, history, uptime, urlData, onCheckHealth, onUpdateSettings }: UrlMetricsProps) {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h")
  const [isChecking, setIsChecking] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newTag, setNewTag] = useState("")

  // Filter history based on selected time range
  const filteredHistory = history.filter((check) => {
    const checkDate = new Date(check.timestamp)
    const now = new Date()
    const timeDiff = now.getTime() - checkDate.getTime()

    switch (timeRange) {
      case "24h":
        return timeDiff <= 24 * 60 * 60 * 1000
      case "7d":
        return timeDiff <= 7 * 24 * 60 * 60 * 1000
      case "30d":
        return timeDiff <= 30 * 24 * 60 * 60 * 1000
      default:
        return true
    }
  })

  // Calculate metrics
  const totalChecks = filteredHistory.length
  const successfulChecks = filteredHistory.filter((check) => check.status === "UP").length
  const failedChecks = filteredHistory.filter((check) => check.status === "DOWN").length
  const uptimePercentage = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0

  // Calculate response time metrics
  const responseTimes = filteredHistory
    .filter((check) => check.responseTime !== null)
    .map((check) => check.responseTime as number)

  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0
  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0

  // Calculate reliability score
  const reliabilityScore = totalChecks > 0
    ? Math.round(uptimePercentage * 0.7 + (avgResponseTime < 500 ? 30 : avgResponseTime < 1000 ? 20 : 10))
    : 0

  // Handle individual URL health check
  const handleCheckHealth = async () => {
    if (isChecking || !onCheckHealth) return

    setIsChecking(true)
    try {
      await onCheckHealth(url)
    } catch (error) {
      console.error("Error checking URL health:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !urlData.tags.includes(newTag.trim())) {
      onUpdateSettings?.({
        tags: [...urlData.tags, newTag.trim()]
      })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    onUpdateSettings?.({
      tags: urlData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getStatusColor = (status: string) => {
    return status === "UP" ? "text-green-400" : "text-red-400"
  }

  const getPriorityColor = (priority: string) => {
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
  }

  return (
    <div className="space-y-6 p-6">
      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="glass">
          <TabsTrigger value="metrics" className="data-[state=active]:bg-blue-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">{url}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getPriorityColor(urlData.priority)} size="sm">
                  {urlData.priority}
                </Badge>
                {urlData.notifications && (
                  <Badge variant="outline" size="sm" className="border-blue-600 text-blue-400">
                    <Bell className="w-3 h-3 mr-1" />
                    Notifications
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCheckHealth}
                disabled={isChecking}
                variant="outline"
                size="sm"
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isChecking ? "animate-spin" : ""}`} />
                {isChecking ? "Checking..." : "Check Now"}
              </Button>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-24 bg-gray-800 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24h</SelectItem>
                  <SelectItem value="7d">7d</SelectItem>
                  <SelectItem value="30d">30d</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <p className="text-sm text-gray-400">Checks ({timeRange})</p>
              </div>
              <p className="text-2xl font-bold text-white">{totalChecks}</p>
              <p className="text-xs text-gray-500 mt-1">
                {timeRange === "24h" ? "Last 24 hours" : timeRange === "7d" ? "Last 7 days" : "Last 30 days"}
              </p>
            </div>

            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <p className="text-sm text-gray-400">Uptime ({timeRange})</p>
              </div>
              <p className="text-2xl font-bold text-green-400">{uptimePercentage.toFixed(1)}%</p>
              <Progress value={uptimePercentage} className="mt-2" />
            </div>

            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <p className="text-sm text-gray-400">Avg Response ({timeRange})</p>
              </div>
              <p className="text-2xl font-bold text-blue-400">{Math.round(avgResponseTime)}ms</p>
              <p className="text-xs text-gray-500 mt-1">Based on {responseTimes.length} checks</p>
            </div>
          </div>

          {/* Additional metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <p className="text-sm text-gray-400">Fastest Response</p>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{minResponseTime}ms</p>
            </div>

            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-orange-400" />
                <p className="text-sm text-gray-400">Slowest Response</p>
              </div>
              <p className="text-2xl font-bold text-orange-400">{maxResponseTime}ms</p>
            </div>

            <div className="glass rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <p className="text-sm text-gray-400">Reliability Score</p>
              </div>
              <p className="text-2xl font-bold text-purple-400">{reliabilityScore}/100</p>
            </div>
          </div>

          {/* Response Time Chart */}
          <div className="glass rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-4">Response Time Trend</h4>
            <div className="h-32 flex items-end gap-1">
              {filteredHistory.slice(-20).map((check, index) => {
                const height = check.responseTime 
                  ? Math.max(4, (check.responseTime / Math.max(...responseTimes, 1)) * 100)
                  : 4
                
                return (
                  <div
                    key={index}
                    className={`flex-1 rounded-t transition-all duration-300 chart-bar ${
                      check.status === "UP" ? "bg-green-400" : "bg-red-400"
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${check.responseTime || 0}ms - ${check.status}`}
                  />
                )
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="glass rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Check History</h4>
              <div className="text-sm text-gray-400">
                {filteredHistory.length} checks in {timeRange}
              </div>
            </div>

            {filteredHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-400">Timestamp</th>
                      <th className="text-left py-2 px-3 text-gray-400">Status</th>
                      <th className="text-left py-2 px-3 text-gray-400">Response Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory
                      .slice()
                      .reverse()
                      .slice(0, 50) // Show only last 50 for performance
                      .map((check, index) => (
                        <tr
                          key={index}
                          className={`border-b border-gray-700 hover:bg-gray-800/30 transition-colors ${
                            index % 2 === 0 ? "bg-gray-800/10" : ""
                          }`}
                        >
                          <td className="py-2 px-3 text-gray-300">{formatDate(check.timestamp)}</td>
                          <td className={`py-2 px-3 font-medium ${getStatusColor(check.status)}`}>
                            {check.status}
                          </td>
                          <td className="py-2 px-3 text-blue-400">
                            {check.responseTime ? `${check.responseTime}ms` : "N/A"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No historical data available for the selected time period.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="space-y-6">
            {/* Basic Settings */}
            <div className="glass rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-4">Basic Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Priority Level</label>
                  <Select
                    value={urlData.priority}
                    onValueChange={(value) => onUpdateSettings?.({ priority: value as any })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Check Interval</label>
                  <Select
                    value={urlData.checkInterval.toString()}
                    onValueChange={(value) => onUpdateSettings?.({ checkInterval: parseInt(value) })}
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
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-300">Enable Notifications</label>
                    <p className="text-xs text-gray-500">Get notified when status changes</p>
                  </div>
                  <Switch
                    checked={urlData.notifications}
                    onCheckedChange={(checked) => onUpdateSettings?.({ notifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-300">Enable Monitoring</label>
                    <p className="text-xs text-gray-500">Include in automatic checks</p>
                  </div>
                  <Switch
                    checked={urlData.isEnabled}
                    onCheckedChange={(checked) => onUpdateSettings?.({ isEnabled: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="glass rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-4">Tags</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <Button onClick={addTag} disabled={!newTag.trim()}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {urlData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-blue-600 text-blue-400 cursor-pointer hover:bg-blue-600 hover:text-white"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="glass rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-4">Status Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Checked:</span>
                  <span className="text-white">{formatDate(urlData.lastChecked)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Status:</span>
                  <Badge className={urlData.status === "UP" ? "bg-green-600" : "bg-red-600"}>
                    {urlData.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Checks:</span>
                  <span className="text-white">{urlData.history.length}</span>
                </div>
                {urlData.lastNotification && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Notification:</span>
                    <span className="text-white">{formatDate(urlData.lastNotification)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
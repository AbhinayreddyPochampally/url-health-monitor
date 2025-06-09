"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Clock, Calendar, Zap, Activity, Shield, RefreshCw, History } from "lucide-react"

interface HistoricalCheck {
  timestamp: string
  status: "UP" | "DOWN"
  responseTime: number | null
}

interface UrlMetricsProps {
  url: string
  history: HistoricalCheck[]
  uptime: number
  onCheckHealth?: (url: string) => Promise<void>
}

export function UrlMetrics({ url, history, uptime, onCheckHealth }: UrlMetricsProps) {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h")
  const [isChecking, setIsChecking] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Filter history based on selected time range with more precise filtering
  const filteredHistory = history.filter((check) => {
    const checkDate = new Date(check.timestamp)
    const now = new Date()
    const timeDiff = now.getTime() - checkDate.getTime()

    switch (timeRange) {
      case "24h":
        return timeDiff <= 24 * 60 * 60 * 1000 // Last 24 hours
      case "7d":
        return timeDiff <= 7 * 24 * 60 * 60 * 1000 // Last 7 days
      case "30d":
        return timeDiff <= 30 * 24 * 60 * 60 * 1000 // Last 30 days
      default:
        return true
    }
  })

  // Calculate metrics
  const totalChecks = filteredHistory.length
  const successfulChecks = filteredHistory.filter((check) => check.status === "UP").length
  const failedChecks = filteredHistory.filter((check) => check.status === "DOWN").length
  const uptimePercentage = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0

  // Calculate average response time
  const responseTimes = filteredHistory
    .filter((check) => check.responseTime !== null)
    .map((check) => check.responseTime as number)

  const avgResponseTime =
    responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0

  // Calculate additional metrics
  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0

  // Calculate reliability score (weighted metric)
  const reliabilityScore =
    totalChecks > 0
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Get status color class
  const getStatusColor = (status: string) => {
    return status === "UP" ? "text-green-400" : "text-red-400"
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Health Metrics for {url}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckHealth}
              disabled={isChecking}
              className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white mr-2"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isChecking ? "animate-spin" : ""}`} />
              {isChecking ? "Checking..." : "Check Now"}
            </Button>
            <Button
              variant={timeRange === "24h" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("24h")}
              className={timeRange === "24h" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-600 text-gray-300"}
            >
              24h
            </Button>
            <Button
              variant={timeRange === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("7d")}
              className={timeRange === "7d" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-600 text-gray-300"}
            >
              7d
            </Button>
            <Button
              variant={timeRange === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("30d")}
              className={timeRange === "30d" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-600 text-gray-300"}
            >
              30d
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary metrics - First row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <p className="text-sm text-gray-400">Checks ({timeRange})</p>
            </div>
            <p className="text-2xl font-bold text-white">{totalChecks}</p>
            <p className="text-xs text-gray-500 mt-1">
              {timeRange === "24h" ? "Last 24 hours" : timeRange === "7d" ? "Last 7 days" : "Last 30 days"}
            </p>
          </div>

          <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <p className="text-sm text-gray-400">Uptime ({timeRange})</p>
            </div>
            <p className="text-2xl font-bold text-green-400">{uptimePercentage.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {successfulChecks} of {totalChecks} checks successful
            </p>
          </div>

          <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <p className="text-sm text-gray-400">Avg Response ({timeRange})</p>
            </div>
            <p className="text-2xl font-bold text-blue-400">{Math.round(avgResponseTime)}ms</p>
            <p className="text-xs text-gray-500 mt-1">Based on {responseTimes.length} successful checks</p>
          </div>
        </div>

        {/* Additional metrics - Second row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <p className="text-sm text-gray-400">Fastest Response</p>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{minResponseTime}ms</p>
            <p className="text-xs text-gray-500 mt-1">Best response time recorded</p>
          </div>

          <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-orange-400" />
              <p className="text-sm text-gray-400">Slowest Response</p>
            </div>
            <p className="text-2xl font-bold text-orange-400">{maxResponseTime}ms</p>
            <p className="text-xs text-gray-500 mt-1">Worst response time recorded</p>
          </div>

          <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <p className="text-sm text-gray-400">Reliability Score</p>
            </div>
            <p className="text-2xl font-bold text-purple-400">{reliabilityScore}/100</p>
            <p className="text-xs text-gray-500 mt-1">Weighted performance metric</p>
          </div>
        </div>

        {/* Historical Check Data */}
        <div className="bg-gray-750 p-4 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <p className="text-sm text-gray-400">Historical Check Data</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
            >
              {showHistory ? "Hide History" : "Show History"}
            </Button>
          </div>

          {showHistory ? (
            filteredHistory.length > 0 ? (
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
                      .map((check, index) => (
                        <tr
                          key={index}
                          className={`border-b border-gray-700 ${
                            index % 2 === 0 ? "bg-gray-800/30" : "bg-gray-800/10"
                          }`}
                        >
                          <td className="py-2 px-3 text-gray-300">{formatDate(check.timestamp)}</td>
                          <td className={`py-2 px-3 font-medium ${getStatusColor(check.status)}`}>{check.status}</td>
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
                <p>No historical data available for the selected time period.</p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-gray-400">
                <p>{filteredHistory.length} checks recorded in this time period</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">First Check</p>
                  <p className="text-sm text-gray-300">
                    {filteredHistory.length > 0 ? formatDate(filteredHistory[0].timestamp) : "N/A"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Latest Check</p>
                  <p className="text-sm text-gray-300">
                    {filteredHistory.length > 0
                      ? formatDate(filteredHistory[filteredHistory.length - 1].timestamp)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

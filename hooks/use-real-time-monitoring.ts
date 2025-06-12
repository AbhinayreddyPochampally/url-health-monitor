"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UrlCheck {
  id: string
  url: string
  status: "UP" | "DOWN" | "CHECKING"
  responseTime: number | null
  isEnabled: boolean
}

interface MonitoringStats {
  timestamp: string
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  avgResponseTime: number
  upUrls: number
  downUrls: number
}

interface UseRealTimeMonitoringProps {
  urls: UrlCheck[]
  onStatusChange: (urlId: string, oldStatus: string, newStatus: string, responseTime: number | null) => void
  interval: number
}

export function useRealTimeMonitoring({ urls, onStatusChange, interval }: UseRealTimeMonitoringProps) {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [monitoringStats, setMonitoringStats] = useState<MonitoringStats[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const urlStatusRef = useRef<Map<string, string>>(new Map())

  const checkUrl = useCallback(async (url: UrlCheck) => {
    const oldStatus = urlStatusRef.current.get(url.id) || url.status

    try {
      const response = await fetch("/api/check-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.url }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      const newStatus = result.status
      const responseTime = result.responseTime

      // Update our status tracking
      urlStatusRef.current.set(url.id, newStatus)

      // Notify of status change
      if (oldStatus !== newStatus) {
        onStatusChange(url.id, oldStatus, newStatus, responseTime)
      }

      return { status: newStatus, responseTime }
    } catch (error) {
      const newStatus = "DOWN"
      urlStatusRef.current.set(url.id, newStatus)
      
      if (oldStatus !== newStatus) {
        onStatusChange(url.id, oldStatus, newStatus, null)
      }

      return { status: newStatus, responseTime: null }
    }
  }, [onStatusChange])

  const performMonitoringCycle = useCallback(async () => {
    if (urls.length === 0) return

    const enabledUrls = urls.filter(url => url.isEnabled)
    if (enabledUrls.length === 0) return

    const results = await Promise.all(enabledUrls.map(checkUrl))
    
    // Calculate stats
    const totalChecks = results.length
    const successfulChecks = results.filter(r => r.status === "UP").length
    const failedChecks = results.filter(r => r.status === "DOWN").length
    const avgResponseTime = results
      .filter(r => r.responseTime !== null)
      .reduce((acc, r) => acc + (r.responseTime || 0), 0) / Math.max(results.filter(r => r.responseTime !== null).length, 1)
    
    const upUrls = results.filter(r => r.status === "UP").length
    const downUrls = results.filter(r => r.status === "DOWN").length

    const newStats: MonitoringStats = {
      timestamp: new Date().toISOString(),
      totalChecks,
      successfulChecks,
      failedChecks,
      avgResponseTime: Math.round(avgResponseTime),
      upUrls,
      downUrls
    }

    setMonitoringStats(prev => {
      const updated = [...prev, newStats]
      // Keep only last 50 data points for performance
      return updated.slice(-50)
    })
  }, [urls, checkUrl])

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return

    setIsMonitoring(true)
    
    // Perform initial check
    performMonitoringCycle()
    
    // Set up interval
    intervalRef.current = setInterval(performMonitoringCycle, interval)
  }, [isMonitoring, performMonitoringCycle, interval])

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Update interval when it changes
  useEffect(() => {
    if (isMonitoring) {
      stopMonitoring()
      startMonitoring()
    }
  }, [interval])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Initialize URL status tracking
  useEffect(() => {
    urls.forEach(url => {
      if (!urlStatusRef.current.has(url.id)) {
        urlStatusRef.current.set(url.id, url.status)
      }
    })
  }, [urls])

  return {
    isMonitoring,
    monitoringStats,
    startMonitoring,
    stopMonitoring
  }
}
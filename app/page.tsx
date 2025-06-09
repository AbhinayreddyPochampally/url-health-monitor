"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, RefreshCw, Globe, Clock, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { UrlMetrics } from "@/components/url-metrics"

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
}

const MAX_HISTORY_ENTRIES = 1000 // Limit history to prevent memory issues

export default function UrlHealthMonitor() {
  const [urls, setUrls] = useState<UrlCheck[]>([])
  const [newUrl, setNewUrl] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [bulkUrls, setBulkUrls] = useState("")
  const [showBulkInput, setShowBulkInput] = useState(false)
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Use ref to prevent memory leaks
  const checkingRef = useRef<Set<string>>(new Set())

  // Safe localStorage operations with error handling
  const saveToLocalStorage = useCallback((data: UrlCheck[]) => {
    try {
      // Limit the amount of data stored to prevent localStorage quota issues
      const limitedData = data.map((url) => ({
        ...url,
        history: url.history.slice(-100), // Keep only last 100 entries in localStorage
      }))
      localStorage.setItem("url-monitor-data", JSON.stringify(limitedData))
    } catch (error) {
      console.warn("Failed to save to localStorage:", error)
      setError("Failed to save data locally. Storage may be full.")
    }
  }, [])

  const loadFromLocalStorage = useCallback((): UrlCheck[] => {
    try {
      const saved = localStorage.getItem("url-monitor-data")
      if (saved) {
        const parsed = JSON.parse(saved)
        // Validate the data structure
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item) =>
              item && typeof item.id === "string" && typeof item.url === "string" && Array.isArray(item.history),
          )
        }
      }
    } catch (error) {
      console.warn("Failed to load from localStorage:", error)
      setError("Failed to load saved data. Starting fresh.")
    }
    return []
  }, [])

  // Load saved URLs from localStorage on mount
  useEffect(() => {
    const savedUrls = loadFromLocalStorage()
    if (savedUrls.length > 0) {
      setUrls(savedUrls)
    }
  }, [loadFromLocalStorage])

  // Save URLs to localStorage whenever urls change (debounced)
  useEffect(() => {
    if (urls.length > 0) {
      const timeoutId = setTimeout(() => {
        saveToLocalStorage(urls)
      }, 1000) // Debounce saves

      return () => clearTimeout(timeoutId)
    }
  }, [urls, saveToLocalStorage])

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timeoutId = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timeoutId)
    }
  }, [error])

  const addUrl = useCallback(() => {
    if (!newUrl.trim()) return

    // Basic URL validation
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

    // Check if URL already exists
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
    }

    setUrls((prev) => [newUrlCheck, ...prev])
    setNewUrl("")
    setError(null)
    checkSingleUrl(newUrlCheck.id, newUrl)
  }, [newUrl, urls])

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

        // Check if URL already exists
        if (!urls.some((existingUrl) => existingUrl.url === url)) {
          validUrls.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url,
            status: "CHECKING",
            responseTime: null,
            lastChecked: new Date().toISOString(),
            history: [],
            uptime: 0,
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

      // Check all new URLs with delay to prevent overwhelming
      validUrls.forEach((urlCheck, index) => {
        setTimeout(() => {
          checkSingleUrl(urlCheck.id, urlCheck.url)
        }, index * 500) // 500ms delay between checks
      })
    }
  }, [bulkUrls, urls])

  const checkSingleUrl = useCallback(async (id: string, url: string) => {
    // Prevent duplicate checks
    if (checkingRef.current.has(id)) {
      return
    }

    checkingRef.current.add(id)

    try {
      // Update status to CHECKING
      setUrls((prev) => {
        return prev.map((urlCheck) => {
          if (urlCheck.id === id) {
            return {
              ...urlCheck,
              status: "CHECKING" as const,
            }
          }
          return urlCheck
        })
      })

      const response = await fetch("/api/check-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      setUrls((prev) => {
        return prev.map((urlCheck) => {
          if (urlCheck.id === id) {
            // Create new history entry
            const newHistoryEntry: HistoricalCheck = {
              timestamp: new Date().toISOString(),
              status: result.status,
              responseTime: result.responseTime,
            }

            // Add to history with size limit
            const updatedHistory = [...urlCheck.history, newHistoryEntry].slice(-MAX_HISTORY_ENTRIES)

            // Calculate uptime percentage
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
        })
      })
    } catch (error) {
      console.error("Error checking URL:", error)

      setUrls((prev) => {
        return prev.map((urlCheck) => {
          if (urlCheck.id === id) {
            // Create new history entry for failed check
            const newHistoryEntry: HistoricalCheck = {
              timestamp: new Date().toISOString(),
              status: "DOWN",
              responseTime: null,
            }

            // Add to history with size limit
            const updatedHistory = [...urlCheck.history, newHistoryEntry].slice(-MAX_HISTORY_ENTRIES)

            // Calculate uptime percentage
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
        })
      })
    } finally {
      checkingRef.current.delete(id)
    }
  }, [])

  const checkAllUrls = useCallback(async () => {
    if (isChecking || urls.length === 0) return

    setIsChecking(true)
    setError(null)

    try {
      // Update all URLs to CHECKING status
      setUrls((prev) => prev.map((url) => ({ ...url, status: "CHECKING" as const })))

      // Check all URLs with controlled concurrency
      const batchSize = 5 // Check 5 URLs at a time
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize)
        const promises = batch.map((url) => checkSingleUrl(url.id, url.url))
        await Promise.all(promises)

        // Small delay between batches
        if (i + batchSize < urls.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    } catch (error) {
      console.error("Error checking all URLs:", error)
      setError("Failed to check some URLs. Please try again.")
    } finally {
      setIsChecking(false)
    }
  }, [isChecking, urls, checkSingleUrl])

  const removeUrl = useCallback((id: string) => {
    setUrls((prev) => prev.filter((url) => url.id !== id))
    checkingRef.current.delete(id)
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "UP":
        return "bg-green-900/50 text-green-400 border-green-600"
      case "DOWN":
        return "bg-red-900/50 text-red-400 border-red-600"
      case "CHECKING":
        return "bg-blue-900/50 text-blue-400 border-blue-600"
      default:
        return "bg-gray-800 text-gray-400 border-gray-600"
    }
  }, [])

  const toggleUrlExpansion = useCallback((url: string) => {
    setExpandedUrl((prev) => (prev === url ? null : url))
  }, [])

  // Memoized calculations
  const stats = {
    total: urls.length,
    up: urls.filter((url) => url.status === "UP").length,
    down: urls.filter((url) => url.status === "DOWN").length,
    avgResponseTime:
      urls.filter((url) => url.responseTime).length > 0
        ? Math.round(
            urls.filter((url) => url.responseTime).reduce((acc, url) => acc + (url.responseTime || 0), 0) /
              urls.filter((url) => url.responseTime).length,
          )
        : 0,
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Error Display */}
        {error && <div className="mb-4 p-4 bg-red-900/50 border border-red-600 rounded-lg text-red-400">{error}</div>}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">URL Monitor</h1>
          </div>
          <p className="text-gray-300">Professional website health monitoring with real-time metrics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total URLs</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-600/20">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Online</p>
                  <p className="text-2xl font-bold text-green-400">{stats.up}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-600/20">
                  <div className="w-5 h-5 bg-red-500 rounded-full" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Offline</p>
                  <p className="text-2xl font-bold text-red-400">{stats.down}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg Response</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.avgResponseTime}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add URL Form */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-400" />
                Add URLs to Monitor
              </div>
              <Button
                onClick={() => setShowBulkInput(!showBulkInput)}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
              >
                {showBulkInput ? "Single URL" : "Bulk Add"}
              </Button>
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
                  className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400"
                />
                <Button onClick={addUrl} className="bg-green-600 hover:bg-green-700 text-white">
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
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder:text-gray-400 focus:border-blue-400 resize-none"
                />
                <div className="flex gap-4">
                  <Button onClick={addBulkUrls} className="bg-green-600 hover:bg-green-700 text-white">
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

            <div className="flex justify-center">
              <Button
                onClick={checkAllUrls}
                disabled={isChecking || urls.length === 0}
                variant="outline"
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
                Check All URLs ({urls.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* URL List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Monitored URLs
              {urls.length > 0 && (
                <Badge className="bg-blue-600/20 text-blue-400 border-blue-600 ml-2">{urls.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urls.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Globe className="w-16 h-16 mx-auto mb-4 text-blue-400/50" />
                <p className="text-lg">No URLs being monitored</p>
                <p className="text-sm text-gray-500">Add your first URL to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urls.map((url) => (
                  <div key={url.id} className="border border-gray-600 rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-gray-750 hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => toggleUrlExpansion(url.url)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            url.status === "UP"
                              ? "bg-green-400"
                              : url.status === "DOWN"
                                ? "bg-red-500"
                                : "bg-blue-400 animate-pulse"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{url.url}</p>
                          <p className="text-sm text-gray-400">
                            Last checked: {new Date(url.lastChecked).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {url.responseTime && (
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Response</p>
                            <p className="font-medium text-blue-400">{url.responseTime}ms</p>
                          </div>
                        )}

                        <div className="text-right">
                          <p className="text-sm text-gray-400">Uptime</p>
                          <p className="font-medium text-green-400">{url.uptime.toFixed(1)}%</p>
                        </div>

                        <Badge className={getStatusColor(url.status)}>{url.status}</Badge>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            checkSingleUrl(url.id, url.url)
                          }}
                          variant="outline"
                          size="sm"
                          disabled={url.status === "CHECKING"}
                          className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                        >
                          <RefreshCw className={`w-3 h-3 mr-1 ${url.status === "CHECKING" ? "animate-spin" : ""}`} />
                          Check
                        </Button>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeUrl(url.id)
                          }}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          Remove
                        </Button>

                        {expandedUrl === url.url ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded metrics view */}
                    {expandedUrl === url.url && (
                      <div className="border-t border-gray-600">
                        <UrlMetrics
                          url={url.url}
                          history={url.history}
                          uptime={url.uptime}
                          onCheckHealth={(urlToCheck) => checkSingleUrl(url.id, urlToCheck)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

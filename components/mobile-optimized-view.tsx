"use client"

import { useState } from "react"
import { Plus, RefreshCw, Globe, Search, Settings, Filter, ChevronDown, ChevronUp, CheckCircle, XCircle, Zap, Activity, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MobileOptimizedViewProps {
  urls: any[]
  stats: any
  isMonitoring: boolean
  isOnline: boolean
  onAddUrl: () => void
  onCheckUrl: (id: string, url: string) => void
  onRemoveUrl: (id: string) => void
  onToggleEnabled: (id: string) => void
  onToggleExpansion: (url: string) => void
  expandedUrl: string | null
  newUrl: string
  setNewUrl: (url: string) => void
  error: string | null
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterStatus: string
  setFilterStatus: (status: string) => void
  settings: any
  setSettings: (settings: any) => void
}

export function MobileOptimizedView({
  urls,
  stats,
  isMonitoring,
  isOnline,
  onAddUrl,
  onCheckUrl,
  onRemoveUrl,
  onToggleEnabled,
  onToggleExpansion,
  expandedUrl,
  newUrl,
  setNewUrl,
  error,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  settings,
  setSettings
}: MobileOptimizedViewProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UP":
        return "bg-green-500"
      case "DOWN":
        return "bg-red-500"
      case "CHECKING":
        return "bg-blue-500 animate-pulse"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 mobile-optimized">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 glass border-b border-gray-600/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-white">URL Monitor</h1>
            {!isOnline && (
              <Badge variant="destructive" className="text-xs">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="border-blue-600 text-blue-400">
                  <Settings className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="glass border-gray-600/30">
                <SheetHeader>
                  <SheetTitle className="text-white">Settings</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-6">
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="glass rounded-lg p-2">
            <div className="text-lg font-bold text-white">{stats.total}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="glass rounded-lg p-2">
            <div className="text-lg font-bold text-green-400">{stats.up}</div>
            <div className="text-xs text-gray-400">Online</div>
          </div>
          <div className="glass rounded-lg p-2">
            <div className="text-lg font-bold text-red-400">{stats.down}</div>
            <div className="text-xs text-gray-400">Offline</div>
          </div>
          <div className="glass rounded-lg p-2">
            <div className="text-lg font-bold text-blue-400">{stats.avgResponseTime}ms</div>
            <div className="text-xs text-gray-400">Avg</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 glass border-red-500/50 bg-red-900/20 rounded-lg">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search URLs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 mobile-text"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 bg-gray-800/50 border-gray-600 mobile-text">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="up">Up</SelectItem>
              <SelectItem value="down">Down</SelectItem>
              <SelectItem value="checking">Checking</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary mobile-button"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Add URL Form */}
        {showAddForm && (
          <div className="glass rounded-lg p-4 space-y-3 animate-slide-up">
            <Input
              placeholder="https://example.com"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 mobile-text"
            />
            <div className="flex gap-2">
              <Button 
                onClick={onAddUrl} 
                className="flex-1 btn-primary mobile-button"
                disabled={!newUrl.trim()}
              >
                Add URL
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="border-gray-600 text-gray-400 mobile-button"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* URL List */}
      <div className="px-4 pb-4 space-y-3">
        {urls.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Globe className="w-12 h-12 mx-auto mb-4 text-blue-400/50" />
            <p className="mobile-text">No URLs being monitored</p>
            <p className="text-xs text-gray-500">Add your first URL to get started</p>
          </div>
        ) : (
          urls.map((url, index) => (
            <div 
              key={url.id} 
              className="glass mobile-card animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(url.status)}`} />
                    <Switch
                      checked={url.isEnabled}
                      onCheckedChange={() => onToggleEnabled(url.id)}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p 
                        className="font-medium text-white truncate mobile-text cursor-pointer"
                        onClick={() => onToggleExpansion(url.url)}
                      >
                        {url.url}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(url.status)} size="sm">
                          {url.status === "UP" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {url.status === "DOWN" && <XCircle className="w-3 h-3 mr-1" />}
                          {url.status === "CHECKING" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                          {url.status}
                        </Badge>
                        {url.responseTime && (
                          <span className="text-xs text-blue-400">{url.responseTime}ms</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onToggleExpansion(url.url)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 mobile-button"
                  >
                    {expandedUrl === url.url ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Progress value={url.uptime} className="flex-1 h-2" />
                    <span className="text-xs text-green-400 w-12">{url.uptime.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => onCheckUrl(url.id, url.url)}
                      variant="outline"
                      size="sm"
                      disabled={url.status === "CHECKING" || !url.isEnabled}
                      className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white mobile-button"
                    >
                      <RefreshCw className={`w-3 h-3 ${url.status === "CHECKING" ? "animate-spin" : ""}`} />
                    </Button>
                    
                    <Button
                      onClick={() => onRemoveUrl(url.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white mobile-button"
                    >
                      ×
                    </Button>
                  </div>
                </div>

                {/* Expanded view for mobile */}
                {expandedUrl === url.url && (
                  <div className="mt-4 pt-4 border-t border-gray-600/50 animate-slide-up">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="glass rounded-lg p-3">
                        <div className="text-sm font-bold text-white">{url.history.length}</div>
                        <div className="text-xs text-gray-400">Total Checks</div>
                      </div>
                      <div className="glass rounded-lg p-3">
                        <div className="text-sm font-bold text-green-400">
                          {url.history.filter(h => h.status === "UP").length}
                        </div>
                        <div className="text-xs text-gray-400">Successful</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-400">
                      Last checked: {new Date(url.lastChecked).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
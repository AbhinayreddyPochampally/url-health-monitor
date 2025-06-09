"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface MetricsData {
  timestamp: string
  upCount: number
  downCount: number
  avgResponseTime: number
}

interface UrlMetricsChartProps {
  data: MetricsData[]
}

export function UrlMetricsChart({ data }: UrlMetricsChartProps) {
  const maxUp = Math.max(...data.map((d) => d.upCount))
  const maxDown = Math.max(...data.map((d) => d.downCount))
  const maxTotal = Math.max(maxUp, maxDown)

  return (
    <Card className="bg-slate-900/30 border-emerald-500/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-emerald-300 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Health Metrics Over Time
        </CardTitle>
        <CardDescription className="text-slate-400">Historical view of URL health status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((point, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-20 text-sm text-slate-400">
                {new Date(point.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div className="flex-1 flex items-center gap-2">
                {/* Up bar */}
                <div className="flex-1 bg-slate-800/50 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                    style={{ width: `${(point.upCount / maxTotal) * 100}%` }}
                  />
                </div>

                {/* Down bar */}
                <div className="flex-1 bg-slate-800/50 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-500"
                    style={{ width: `${(point.downCount / maxTotal) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-emerald-300">
                  <TrendingUp className="w-3 h-3" />
                  {point.upCount}
                </div>
                <div className="flex items-center gap-1 text-red-300">
                  <TrendingDown className="w-3 h-3" />
                  {point.downCount}
                </div>
                <div className="text-blue-300">{Math.round(point.avgResponseTime)}ms</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

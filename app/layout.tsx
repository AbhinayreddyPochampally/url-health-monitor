import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "URL Monitor - Website Health Monitoring Tool",
  description:
    "Professional URL health monitoring tool to track website uptime, response times, and performance metrics",
  keywords: ["url monitor", "website monitoring", "uptime checker", "health monitoring", "response time"],
  authors: [{ name: "URL Monitor Team" }],
  creator: "URL Monitor",
  publisher: "URL Monitor",
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "URL Monitor - Website Health Monitoring",
    description: "Monitor your websites' health and performance with real-time status checks and historical metrics",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "URL Monitor - Website Health Monitoring",
    description: "Professional URL health monitoring tool with real-time checks and metrics"
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}

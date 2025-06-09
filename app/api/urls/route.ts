import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for demo purposes
// In production, use a proper database
const urlDatabase: Array<{
  id: string
  url: string
  status: "UP" | "DOWN" | "CHECKING"
  responseTime: number | null
  lastChecked: string
  uptime: number
  history: Array<{
    timestamp: string
    status: "UP" | "DOWN"
    responseTime: number | null
  }>
}> = []

export async function GET() {
  return NextResponse.json(urlDatabase)
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Check if URL already exists
    const existingUrl = urlDatabase.find((item) => item.url === url)
    if (existingUrl) {
      return NextResponse.json({ error: "URL already exists" }, { status: 409 })
    }

    const newUrl = {
      id: Date.now().toString(),
      url,
      status: "CHECKING" as const,
      responseTime: null,
      lastChecked: new Date().toISOString(),
      uptime: 0,
      history: [],
    }

    urlDatabase.push(newUrl)

    // Perform initial check
    setTimeout(async () => {
      try {
        const checkResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/check-url`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          },
        )

        const result = await checkResponse.json()

        // Update the URL in database
        const urlIndex = urlDatabase.findIndex((item) => item.id === newUrl.id)
        if (urlIndex !== -1) {
          urlDatabase[urlIndex] = {
            ...urlDatabase[urlIndex],
            status: result.status,
            responseTime: result.responseTime,
            lastChecked: result.timestamp,
            uptime: result.status === "UP" ? 100 : 0,
            history: [
              {
                timestamp: result.timestamp,
                status: result.status,
                responseTime: result.responseTime,
              },
            ],
          }
        }
      } catch (error) {
        console.error("Error checking URL:", error)
      }
    }, 1000)

    return NextResponse.json(newUrl, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const urlIndex = urlDatabase.findIndex((item) => item.id === id)
    if (urlIndex === -1) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    urlDatabase.splice(urlIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

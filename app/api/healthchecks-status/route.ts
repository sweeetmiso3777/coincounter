import { NextResponse } from "next/server"

const HEALTHCHECKS_IO_API_KEY = process.env.HEALTHCHECKS_IO_API_KEY
const HEALTHCHECKS_IO_API_URL = "https://healthchecks.io/api/v3/checks/"

// Type definitions for Healthchecks.io API response
interface Healthcheck {
  id: string
  name: string | null
  slug: string
  tags: string[]
  status: "up" | "down" | "grace" | "paused" | "new" | "healthy" | "unhealthy"
  last_ping: string | null
  unique_key?: string
  uuid?: string
}

interface HealthchecksApiResponse {
  checks: Healthcheck[]
}

interface DeviceStatus {
  status: "online" | "offline"
  lastPing: string
}

export async function GET() {
  if (!HEALTHCHECKS_IO_API_KEY) {
    return NextResponse.json(
      {
        error: "Healthchecks.io API key not configured",
        suggestion: "Please add HEALTHCHECKS_IO_API_KEY to your environment variables",
      },
      { status: 500 },
    )
  }

  try {
    const response = await fetch(HEALTHCHECKS_IO_API_URL, {
      headers: {
        "X-Api-Key": HEALTHCHECKS_IO_API_KEY,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()

      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "Invalid API key",
            suggestion: "Please check your Healthchecks.io API key is correct",
          },
          { status: 401 },
        )
      } else if (response.status === 403) {
        return NextResponse.json(
          {
            error: "API key does not have sufficient permissions",
            suggestion: "Ensure your API key has read access to checks",
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          error: `Healthchecks.io API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const data: HealthchecksApiResponse = await response.json()
    console.log("[v0] Fetched checks from Healthchecks.io:", data.checks?.length || 0)

    const statusData: Record<string, DeviceStatus> = {}

    if (!data.checks || data.checks.length === 0) {
      console.log("[v0] No checks found in API response")
      return NextResponse.json(statusData)
    }

    data.checks?.forEach((check: Healthcheck) => {
      const deviceId = extractDeviceId(check)
      const status = determineStatus(check)

      const deviceIdUpper = deviceId.toUpperCase()
      const deviceIdLower = deviceId.toLowerCase()

      statusData[deviceIdUpper] = {
        status,
        lastPing: check.last_ping || "",
      }

      // Also store lowercase version if different
      if (deviceIdUpper !== deviceIdLower) {
        statusData[deviceIdLower] = {
          status,
          lastPing: check.last_ping || "",
        }
      }

      console.log("[v0] Processed device:", {
        deviceId,
        deviceIdUpper,
        deviceIdLower,
        status,
        checkName: check.name,
        checkStatus: check.status,
        lastPing: check.last_ping
      })
    })

    console.log("[v0] Final statusData keys:", Object.keys(statusData))
    return NextResponse.json(statusData)
  } catch (error) {
    console.error("[v0] Error in healthchecks-status API:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch device status",
        message: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check server logs for more details",
      },
      { status: 500 },
    )
  }
}

// Helper functions
function extractDeviceId(check: Healthcheck): string {
  // Priority: name > slug > tags > unique identifier
  if (check.name && check.name.trim() !== "") {
    return check.name.trim()
  }

  if (check.slug) {
    return check.slug
  }

  if (check.tags && check.tags.length > 0) {
    const deviceTag = check.tags.find(
      (tag: string) => tag.startsWith("device:") || tag.startsWith("esp32:") || /^[a-fA-F0-9]{8}$/.test(tag),
    )
    if (deviceTag) {
      return deviceTag.replace(/^(device:|esp32:)/, "")
    }
    return check.tags[0]
  }

  return check.unique_key || check.uuid || `unknown-${check.id}`
}

function determineStatus(check: Healthcheck): "online" | "offline" {
  if (check.status === "up" || check.status === "healthy") {
    return "online"
  }

  if (check.status === "down" || check.status === "grace" || check.status === "unhealthy") {
    return "offline"
  }

  return "offline"
}
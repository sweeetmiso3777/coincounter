export interface Unit {
  deviceId: string
  // Add other common fields that might exist in your units
  status?: "active" | "inactive" | "maintenance"
  lastSeen?: Date
  location?: string
  model?: string
  firmware?: string
  [key: string]: any // Allow for additional dynamic fields
}

export interface UnitsState {
  units: Unit[]
  loading: boolean
  error: string | null
}

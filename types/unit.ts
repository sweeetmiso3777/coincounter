export interface Unit {
  deviceId: string
  branchId: string
  location?: string
  model?: string
  firmware?: string
  alias?: string
  [key: string]: any // Allow for additional dynamic fields
}

export interface UnitsState {
  units: Unit[]
  loading: boolean
  error: string | null
}

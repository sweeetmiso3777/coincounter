export interface Branch {
  id: string
  branch_manager: string
  created_at: any // Firestore Timestamp
  harvest_day_of_month: number // Changed from date_of_harvest
  location: string
  share: number
}

export interface BranchData {
  id: string
  branch_manager: string
  created_at: Date
  date_of_harvest?: Date // Optional, for compatibility
  harvest_day_of_month: number // Changed from date_of_harvest
  location: string
  share: number
}

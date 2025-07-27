import type { Timestamp } from "firebase/firestore"

export interface Branch {
  id: string
  branch_manager: string
  created_at: Timestamp
  date_of_harvest: Timestamp
  location: string
  share: number
}

export interface BranchData {
  id: string
  branch_manager: string
  created_at: Date
  date_of_harvest: Date
  location: string
  share: number
}

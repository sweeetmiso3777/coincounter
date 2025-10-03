import type { Timestamp } from "firebase/firestore"

export interface SalesDocument {
  id: string
  deviceId: string
  branchId?: string
  coins_1: number
  coins_5: number
  coins_10: number
  coins_20: number
  total: number
  timestamp: Timestamp | Date | string | { seconds: number; nanoseconds: number }
  isRecovered?: boolean

}

export interface SalesWithBranch extends SalesDocument {
  branchName?: string
}

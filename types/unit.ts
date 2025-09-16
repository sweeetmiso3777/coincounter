export interface Unit {
  id: string // This is the deviceId (document ID from Firebase)
  branch: string // Branch ID (Firebase auto ID)
  created_at: any // Firestore Timestamp
  // Add other unit fields as needed
}

export interface Sale {
  id: string
  coins_1: number
  coins_5: number
  coins_10: number
  coins_20: number
  total: number
  timestamp: any // Firestore Timestamp
}

export interface UnitWithBranchAndSales {
  id: string // This is the deviceId
  branchId: string
  branchName: string
  totalSales: number
}

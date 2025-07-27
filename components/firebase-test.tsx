"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

export function FirebaseTest() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Try to read from Branches collection
        const branchesRef = collection(db, "Branches")
        await getDocs(branchesRef)
        setStatus("connected")
      } catch (err) {
        setStatus("error")
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-4 border rounded-lg mb-4">
      <h3 className="font-semibold mb-2">Firebase Connection Status</h3>
      {status === "loading" && <p className="text-blue-600">Testing connection...</p>}
      {status === "connected" && <p className="text-green-600">✅ Connected to Firebase!</p>}
      {status === "error" && (
        <div className="text-red-600">
          <p>❌ Connection failed</p>
          <p className="text-sm mt-1">Error: {error}</p>
        </div>
      )}
    </div>
  )
}

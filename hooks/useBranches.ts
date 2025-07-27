"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Branch, BranchData } from "@/types/branch"

export function useBranches() {
  const [branches, setBranches] = useState<BranchData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBranches = () => {
      try {
        setLoading(true)
        const branchesRef = collection(db, "Branches")
        const q = query(branchesRef, orderBy("created_at", "desc"))

        // Real-time listener
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const branchesData: BranchData[] = snapshot.docs.map((doc) => {
              const data = doc.data() as Omit<Branch, "id">
              return {
                id: doc.id,
                branch_manager: data.branch_manager,
                created_at: data.created_at.toDate(),
                date_of_harvest: data.date_of_harvest.toDate(),
                location: data.location,
                share: data.share,
              }
            })
            setBranches(branchesData)
            setLoading(false)
          },
          (err) => {
            setError(err.message)
            setLoading(false)
          },
        )

        return unsubscribe
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setLoading(false)
        return () => {} // Return empty function if error
      }
    }

    const unsubscribe = fetchBranches()

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [])

  return { branches, loading, error }
}

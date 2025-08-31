"use client"

import { useState, useEffect } from "react"
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  getDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Branch, BranchData } from "@/types/branch"

// Simple in-memory cache
let cachedBranches: BranchData[] | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function updateBranch(id: string, data: any) {
  const ref = doc(db, "Branches", id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error(`Branch with ID "${id}" does not exist`)
  await updateDoc(ref, data)
}

export async function createBranchWithId(id: string, data: any) {
  const branchRef = doc(db, "Branches", id)

  // Check if this ID already exists
  const existing = await getDoc(branchRef)
  if (existing.exists()) {
    throw new Error("Branch ID already exists. Please choose another.")
  }

  await setDoc(branchRef, {
    ...data,
    created_at: serverTimestamp(),
  })
}

export function useBranches() {
  const [branches, setBranches] = useState<BranchData[]>(() => {
    // Initialize with cached data if available and fresh
    if (cachedBranches && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return cachedBranches
    }
    return []
  })
  const [loading, setLoading] = useState(() => {
    // Don't show loading if we have fresh cached data
    const hasFreshCache = cachedBranches && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION
    return !hasFreshCache
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBranches = () => {
      try {
        const hasFreshCache = cachedBranches && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION

        if (hasFreshCache) {
          setBranches(cachedBranches!)
          setLoading(false)
          // Don't return early - still set up the listener for real-time updates
        } else {
          setLoading(true)
        }

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
                created_at: data.created_at?.toDate() || new Date(), // Handle null/undefined
                harvest_day_of_month: data.harvest_day_of_month || 1, // Changed from date_of_harvest
                location: data.location,
                share: data.share,
              }
            })

            // Update cache
            cachedBranches = branchesData
            cacheTimestamp = Date.now()

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
        return () => {}
      }
    }

    const unsubscribe = fetchBranches()
    return () => {
      unsubscribe()
    }
  }, [])

  return { branches, loading, error }
}

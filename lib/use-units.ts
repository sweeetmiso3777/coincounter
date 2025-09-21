"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Unit, UnitsState } from "@/types/unit"

export function useUnits(realtime = false) {
  const [state, setState] = useState<UnitsState>({
    units: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))

        const unitsCollection = collection(db, "Units")
        const unitsQuery = query(unitsCollection, orderBy("__name__")) // Order by document ID (deviceId)

        if (realtime) {
          // Set up real-time listener
          const unsubscribe = onSnapshot(
            unitsQuery,
            (snapshot) => {
              const unitsData: Unit[] = []
              snapshot.forEach((doc) => {
                const data = doc.data()
                unitsData.push({
                  deviceId: doc.id,
                  ...data,
                  // Convert Firestore timestamps to Date objects if they exist
                  lastSeen: data.lastSeen?.toDate?.() || data.lastSeen,
                })
              })
              setState({ units: unitsData, loading: false, error: null })
            },
            (error) => {
              console.error("Error in real-time units listener:", error)
              setState((prev) => ({
                ...prev,
                loading: false,
                error: "Failed to fetch units in real-time. Please check your connection.",
              }))
            },
          )

          return unsubscribe
        } else {
          // One-time fetch
          const unitsSnapshot = await getDocs(unitsQuery)
          const unitsData: Unit[] = []

          unitsSnapshot.forEach((doc) => {
            const data = doc.data()
            unitsData.push({
              deviceId: doc.id,
              ...data,
              // Convert Firestore timestamps to Date objects if they exist
              lastSeen: data.lastSeen?.toDate?.() || data.lastSeen,
            })
          })

          setState({ units: unitsData, loading: false, error: null })
        }
      } catch (error) {
        console.error("Error fetching units:", error)
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to fetch units. Please check your Firebase configuration.",
        }))
      }
    }

    const cleanup = fetchUnits()

    // Return cleanup function for real-time listener
    return () => {
      if (cleanup instanceof Promise) {
        cleanup.then((unsubscribe) => {
          if (typeof unsubscribe === "function") {
            unsubscribe()
          }
        })
      }
    }
  }, [realtime])

  const refetch = () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    // Trigger re-fetch by updating the effect dependency
  }

  return {
    ...state,
    refetch,
  }
}

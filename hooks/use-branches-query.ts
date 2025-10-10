"use client"

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

export interface BranchData {
  id: string
  branch_manager: string
  location: string
  harvest_day_of_month: number
  last_harvest_date: Timestamp | string | undefined
  created_at: Date
  share: number
  totalUnits: number
  latitude?: number | null
  longitude?: number | null
  affiliates?: string[] // New optional field
}

const listenerRefCount = { count: 0 }
let activeListener: (() => void) | null = null

// Transform Firestore doc
function transformBranchDoc(docSnap: any): BranchData {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    branch_manager: data.branch_manager,
    location: data.location,
    last_harvest_date: data.last_harvest_date ?? undefined,
    harvest_day_of_month: data.harvest_day_of_month,
    created_at: data.created_at instanceof Timestamp ? data.created_at.toDate() : new Date(),
    share: data.share ?? 0,
    totalUnits: data.totalUnits ?? 0,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    affiliates: data.affiliates ?? undefined, // New field transformation
  }
}

export function useBranches() {
  const queryClient = useQueryClient()

  const queryResult = useQuery<BranchData[]>({
    queryKey: ["branches"],
    queryFn: async () => {
      console.log("%c[useBranches] Running queryFn (initial fetch)...", "color: orange; font-weight: bold;")
      const q = query(collection(db, "Branches"), orderBy("created_at", "desc"))

      return new Promise<BranchData[]>((resolve, reject) => {
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            console.log("%c[useBranches] Initial data loaded.", "color: teal; font-weight: bold;")
            unsubscribe()
            resolve(snapshot.docs.map(transformBranchDoc))
          },
          (err) => {
            console.error("%c[useBranches] queryFn error:", "color: red; font-weight: bold;", err)
            reject(err)
          },
        )
      })
    },
    staleTime: Number.POSITIVE_INFINITY,
  })

  useEffect(() => {
    listenerRefCount.count++
    console.log(`[useBranches] Ref count: ${listenerRefCount.count}`)

    if (listenerRefCount.count === 1) {
      console.log("%c[useBranches] Setting up SINGLE listener (first component)", "color: purple; font-weight: bold;")

      const q = query(collection(db, "Branches"), orderBy("created_at", "desc"))
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("%c[useBranches] onSnapshot pushed an update to cache.", "color: magenta; font-weight: bold;")
        queryClient.setQueryData(["branches"], snapshot.docs.map(transformBranchDoc))
      })

      activeListener = unsubscribe
    }

    return () => {
      listenerRefCount.count--
      console.log(`[useBranches] Ref count: ${listenerRefCount.count} (after unmount)`)

      if (listenerRefCount.count === 0 && activeListener) {
        console.log("%c[useBranches] Cleaning up listener (last component unmounted)", "color: gray; font-weight: bold;")
        activeListener()
        activeListener = null
      }
    }
  }, [queryClient])

  const createBranch = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Omit<BranchData, "id" | "created_at">
    }) => {
      console.log("%c[useBranches] createBranch -> Firestore setDoc", "color: orange; font-weight: bold;")
      const ref = doc(db, "Branches", id)
      const existing = await getDoc(ref)
      if (existing.exists()) throw new Error("Branch ID already exists")
      
      // Prepare data for Firestore, handling optional fields
      const firestoreData: any = {
        branch_manager: data.branch_manager,
        location: data.location,
        harvest_day_of_month: data.harvest_day_of_month,
        share: data.share,
        totalUnits: data.totalUnits,
        created_at: Timestamp.now(),
      }

      // Add optional fields only if they exist
      if (data.latitude !== undefined) firestoreData.latitude = data.latitude
      if (data.longitude !== undefined) firestoreData.longitude = data.longitude
      if (data.affiliates !== undefined) firestoreData.affiliates = data.affiliates

      await setDoc(ref, firestoreData)
    },
    onMutate: async ({ id, data }) => {
      console.log("%c[useBranches] Optimistic update (createBranch)", "color: green; font-weight: bold;")
      await queryClient.cancelQueries({ queryKey: ["branches"] })
      const prev = queryClient.getQueryData<BranchData[]>(["branches"]) || []
      const optimistic: BranchData = { 
        id, 
        ...data, 
        created_at: new Date() 
      }
      queryClient.setQueryData(["branches"], [optimistic, ...prev])
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      console.log("%c[useBranches] Rolling back optimistic createBranch.", "color: red; font-weight: bold;")
      if (ctx?.prev) queryClient.setQueryData(["branches"], ctx.prev)
    },
  })

  const updateBranch = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<BranchData, "id" | "created_at">>
    }) => {
      console.log("%c[useBranches] updateBranch -> Firestore updateDoc", "color: orange; font-weight: bold;")
      const ref = doc(db, "Branches", id)
      if (!(await getDoc(ref)).exists()) throw new Error("Branch does not exist")
      
      // Prepare update data, handling null values for removal
      const updateData: any = {}
      
      // Only include fields that are provided
      if (data.branch_manager !== undefined) updateData.branch_manager = data.branch_manager
      if (data.location !== undefined) updateData.location = data.location
      if (data.harvest_day_of_month !== undefined) updateData.harvest_day_of_month = data.harvest_day_of_month
      if (data.share !== undefined) updateData.share = data.share
      if (data.totalUnits !== undefined) updateData.totalUnits = data.totalUnits
      
      // Handle optional fields - including null for removal
      if (data.latitude !== undefined) updateData.latitude = data.latitude
      if (data.longitude !== undefined) updateData.longitude = data.longitude
      if (data.affiliates !== undefined) updateData.affiliates = data.affiliates

      await updateDoc(ref, updateData)
    },
    onMutate: async ({ id, data }) => {
      console.log("%c[useBranches] Optimistic update (updateBranch)", "color: green; font-weight: bold;")
      await queryClient.cancelQueries({ queryKey: ["branches"] })
      const prev = queryClient.getQueryData<BranchData[]>(["branches"]) || []
      queryClient.setQueryData(["branches"], prev.map((b) => (b.id === id ? { ...b, ...data } : b)))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      console.log("%c[useBranches] Rolling back optimistic updateBranch.", "color: red; font-weight: bold;")
      if (ctx?.prev) queryClient.setQueryData(["branches"], ctx.prev)
    },
  })

  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      console.log("%c[useBranches] deleteBranch -> Firestore deleteDoc", "color: orange; font-weight: bold;")
      const ref = doc(db, "Branches", id)
      if (!(await getDoc(ref)).exists()) throw new Error("Branch does not exist")
      await deleteDoc(ref)
    },
    onMutate: async (id) => {
      console.log("%c[useBranches] Optimistic update (deleteBranch)", "color: green; font-weight: bold;")
      await queryClient.cancelQueries({ queryKey: ["branches"] })
      const prev = queryClient.getQueryData<BranchData[]>(["branches"]) || []
      queryClient.setQueryData(["branches"], prev.filter((b) => b.id !== id))
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      console.log("%c[useBranches] Rolling back optimistic deleteBranch.", "color: red; font-weight: bold;")
      if (ctx?.prev) queryClient.setQueryData(["branches"], ctx.prev)
    },
  })

  return { ...queryResult, createBranch, updateBranch, deleteBranch }
}
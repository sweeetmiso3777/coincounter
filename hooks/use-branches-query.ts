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
  getDoc,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

export interface BranchData {
  id: string
  branch_manager: string
  location: string
  harvest_day_of_month: number
  last_harvest_date?: Date | null
  created_at: Date
  share: number
  totalUnits: number
  latitude?: number | null
  longitude?: number | null
  affiliates?: string[]
  archived?: boolean // Added archived field
}

const listenerRefCount = { count: 0 }
let activeListener: (() => void) | null = null

// Helper function to safely convert Firestore timestamps
function convertFirestoreTimestamp(timestamp: Timestamp | Date | string | null | undefined): Date | null {
  if (!timestamp) return null
  if (timestamp instanceof Timestamp) return timestamp.toDate()
  if (timestamp instanceof Date) return timestamp
  if (typeof timestamp === 'string') return new Date(timestamp)
  return null
}

// Transform Firestore doc
function transformBranchDoc(docSnap: DocumentSnapshot<DocumentData>): BranchData {
  const data = docSnap.data()
  if (!data) {
    throw new Error(`No data found for document ${docSnap.id}`)
  }

  return {
    id: docSnap.id,
    branch_manager: data.branch_manager as string,
    location: data.location as string,
    last_harvest_date: convertFirestoreTimestamp(data.last_harvest_date),
    harvest_day_of_month: data.harvest_day_of_month as number,
    created_at: convertFirestoreTimestamp(data.created_at) || new Date(),
    share: data.share as number ?? 0,
    totalUnits: data.totalUnits as number ?? 0,
    latitude: data.latitude as number | null ?? null,
    longitude: data.longitude as number | null ?? null,
    affiliates: data.affiliates as string[] | undefined,
    archived: data.archived as boolean ?? false, // Default to false if not set
  }
}

export function useBranches() {
  const queryClient = useQueryClient()

  const queryResult = useQuery<BranchData[]>({
    queryKey: ["branches"],
    queryFn: async (): Promise<BranchData[]> => {
      console.log("%c[useBranches] Running queryFn (initial fetch)...", "color: orange; font-weight: bold;")
      const q = query(collection(db, "Branches"), orderBy("created_at", "desc"))

      return new Promise<BranchData[]>((resolve, reject) => {
        const unsubscribe = onSnapshot(
          q,
          (snapshot: QuerySnapshot<DocumentData>) => {
            console.log("%c[useBranches] Initial data loaded.", "color: teal; font-weight: bold;")
            unsubscribe()
            resolve(snapshot.docs.map(transformBranchDoc))
          },
          (err: Error) => {
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
      const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
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

  interface CreateBranchParams {
    id: string
    data: Omit<BranchData, "id" | "created_at">
  }

  interface UpdateBranchParams {
    id: string
    data: Partial<Omit<BranchData, "id" | "created_at">>
  }

  interface FirestoreBranchData {
    branch_manager: string
    location: string
    harvest_day_of_month: number
    share: number
    totalUnits: number
    created_at: Timestamp
    last_harvest_date?: Timestamp | null
    latitude?: number | null
    longitude?: number | null
    affiliates?: string[]
    archived?: boolean
  }

  const createBranch = useMutation({
    mutationFn: async ({ id, data }: CreateBranchParams): Promise<void> => {
      console.log("%c[useBranches] createBranch -> Firestore setDoc", "color: orange; font-weight: bold;")
      const ref = doc(db, "Branches", id)
      const existing = await getDoc(ref)
      if (existing.exists()) throw new Error("Branch ID already exists")
      
      // Prepare data for Firestore with proper timestamp conversion
      const firestoreData: FirestoreBranchData = {
        branch_manager: data.branch_manager,
        location: data.location,
        harvest_day_of_month: data.harvest_day_of_month,
        share: data.share,
        totalUnits: data.totalUnits,
        created_at: Timestamp.now(),
        archived: false, // New branches are not archived by default
      }

      // Handle last_harvest_date conversion to Firestore Timestamp
      if (data.last_harvest_date instanceof Date) {
        firestoreData.last_harvest_date = Timestamp.fromDate(data.last_harvest_date)
      } else if (data.last_harvest_date === null) {
        firestoreData.last_harvest_date = null
      }
      // If undefined, don't include the field

      // Add optional fields only if they exist
      if (data.latitude !== undefined) firestoreData.latitude = data.latitude
      if (data.longitude !== undefined) firestoreData.longitude = data.longitude
      if (data.affiliates !== undefined) firestoreData.affiliates = data.affiliates

      await setDoc(ref, firestoreData)
    },
    onMutate: async ({ id, data }: CreateBranchParams) => {
      console.log("%c[useBranches] Optimistic update (createBranch)", "color: green; font-weight: bold;")
      await queryClient.cancelQueries({ queryKey: ["branches"] })
      const prev = queryClient.getQueryData<BranchData[]>(["branches"]) || []
      const optimistic: BranchData = { 
        id, 
        ...data, 
        created_at: new Date(),
        archived: false, // New branches are not archived by default
      }
      queryClient.setQueryData(["branches"], [optimistic, ...prev])
      return { prev }
    },
    onError: (err: Error, variables: CreateBranchParams, context: { prev?: BranchData[] } | undefined) => {
      console.log("%c[useBranches] Rolling back optimistic createBranch.", "color: red; font-weight: bold;")
      if (context?.prev) queryClient.setQueryData(["branches"], context.prev)
    },
  })

  const updateBranch = useMutation({
    mutationFn: async ({ id, data }: UpdateBranchParams): Promise<void> => {
      console.log("%c[useBranches] updateBranch -> Firestore updateDoc", "color: orange; font-weight: bold;")
      const ref = doc(db, "Branches", id)
      const existingDoc = await getDoc(ref)
      if (!existingDoc.exists()) throw new Error("Branch does not exist")
      
      // Prepare update data with proper timestamp conversion
      const updateData: Partial<FirestoreBranchData> = {}
      
      // Only include fields that are provided
      if (data.branch_manager !== undefined) updateData.branch_manager = data.branch_manager
      if (data.location !== undefined) updateData.location = data.location
      if (data.harvest_day_of_month !== undefined) updateData.harvest_day_of_month = data.harvest_day_of_month
      if (data.share !== undefined) updateData.share = data.share
      if (data.totalUnits !== undefined) updateData.totalUnits = data.totalUnits
      if (data.archived !== undefined) updateData.archived = data.archived
      
      // Handle last_harvest_date conversion to Firestore Timestamp
      if (data.last_harvest_date instanceof Date) {
        updateData.last_harvest_date = Timestamp.fromDate(data.last_harvest_date)
      } else if (data.last_harvest_date === null) {
        updateData.last_harvest_date = null
      }
      // If undefined, don't include in update

      // Handle optional fields
      if (data.latitude !== undefined) updateData.latitude = data.latitude
      if (data.longitude !== undefined) updateData.longitude = data.longitude
      if (data.affiliates !== undefined) updateData.affiliates = data.affiliates

      await updateDoc(ref, updateData)
    },
    onMutate: async ({ id, data }: UpdateBranchParams) => {
      console.log("%c[useBranches] Optimistic update (updateBranch)", "color: green; font-weight: bold;")
      await queryClient.cancelQueries({ queryKey: ["branches"] })
      const prev = queryClient.getQueryData<BranchData[]>(["branches"]) || []
      queryClient.setQueryData(["branches"], prev.map((b) => (b.id === id ? { ...b, ...data } : b)))
      return { prev }
    },
    onError: (err: Error, variables: UpdateBranchParams, context: { prev?: BranchData[] } | undefined) => {
      console.log("%c[useBranches] Rolling back optimistic updateBranch.", "color: red; font-weight: bold;")
      if (context?.prev) queryClient.setQueryData(["branches"], context.prev)
    },
  })

  // Archive branch mutation (replaces deleteBranch)
  const archiveBranch = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log("%c[useBranches] archiveBranch -> Firestore updateDoc", "color: orange; font-weight: bold;")
      const ref = doc(db, "Branches", id)
      const existingDoc = await getDoc(ref)
      if (!existingDoc.exists()) throw new Error("Branch does not exist")
      
      await updateDoc(ref, { archived: true })
    },
    onMutate: async (id: string) => {
      console.log("%c[useBranches] Optimistic update (archiveBranch)", "color: green; font-weight: bold;")
      await queryClient.cancelQueries({ queryKey: ["branches"] })
      const prev = queryClient.getQueryData<BranchData[]>(["branches"]) || []
      queryClient.setQueryData(["branches"], prev.map((b) => 
        b.id === id ? { ...b, archived: true } : b
      ))
      return { prev }
    },
    onError: (err: Error, id: string, context: { prev?: BranchData[] } | undefined) => {
      console.log("%c[useBranches] Rolling back optimistic archiveBranch.", "color: red; font-weight: bold;")
      if (context?.prev) queryClient.setQueryData(["branches"], context.prev)
    },
  })

  // Restore branch mutation
  const restoreBranch = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log("%c[useBranches] restoreBranch -> Firestore updateDoc", "color: orange; font-weight: bold;")
      const ref = doc(db, "Branches", id)
      const existingDoc = await getDoc(ref)
      if (!existingDoc.exists()) throw new Error("Branch does not exist")
      
      await updateDoc(ref, { archived: false })
    },
    onMutate: async (id: string) => {
      console.log("%c[useBranches] Optimistic update (restoreBranch)", "color: green; font-weight: bold;")
      await queryClient.cancelQueries({ queryKey: ["branches"] })
      const prev = queryClient.getQueryData<BranchData[]>(["branches"]) || []
      queryClient.setQueryData(["branches"], prev.map((b) => 
        b.id === id ? { ...b, archived: false } : b
      ))
      return { prev }
    },
    onError: (err: Error, id: string, context: { prev?: BranchData[] } | undefined) => {
      console.log("%c[useBranches] Rolling back optimistic restoreBranch.", "color: red; font-weight: bold;")
      if (context?.prev) queryClient.setQueryData(["branches"], context.prev)
    },
  })

  return { 
    ...queryResult, 
    createBranch, 
    updateBranch, 
    archiveBranch, // Replaced deleteBranch with archiveBranch
    restoreBranch, // Added restoreBranch mutation
  }
}
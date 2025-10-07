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
  created_at: Date
  share: number
  totalUnits: number
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
    harvest_day_of_month: data.harvest_day_of_month,
    created_at: data.created_at instanceof Timestamp ? data.created_at.toDate() : new Date(),
    share: data.share ?? 0,
    totalUnits: data.totalUnits ?? 0,
  }
}

export function useBranches() {
  const queryClient = useQueryClient()

  const queryResult = useQuery<BranchData[]>({
    queryKey: ["branches"],
    queryFn: async () => {
      console.log("%c[useBranches] Running queryFn (initial fetch)...", "color: orange; font-weight: bold;")
      const q = query(collection(db, "Branches"), orderBy("created_at", "desc"))

      // Simple promise-based fetch for initial load
      return new Promise<BranchData[]>((resolve, reject) => {
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            console.log("%c[useBranches] Initial data loaded.", "color: teal; font-weight: bold;")
            unsubscribe() // Immediately unsubscribe after first load
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

  if (queryResult.isFetching) {
    console.log("%c[useBranches] Fetching data...", "color: blue; font-weight: bold;")
  }
  if (queryResult.isSuccess && queryResult.data) {
    if (queryResult.isFetched && !queryResult.isFetching) {
      console.log("%c[useBranches] Using cached data (from react-query).", "color: green; font-weight: bold;")
    }
  }

  useEffect(() => {
    // Increment ref count
    listenerRefCount.count++
    console.log(`[useBranches] Ref count: ${listenerRefCount.count}`)

    // Only setup listener if first component
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
      // Decrement ref count
      listenerRefCount.count--
      console.log(`[useBranches] Ref count: ${listenerRefCount.count} (after unmount)`)

      // Only cleanup if last component
      if (listenerRefCount.count === 0 && activeListener) {
        console.log(
          "%c[useBranches] Cleaning up listener (last component unmounted)",
          "color: gray; font-weight: bold;",
        )
        activeListener()
        activeListener = null
      }
    }
  }, [queryClient])

  // Mutations (optimistic updates)
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
      if (existing.exists()) {
        throw new Error("Branch ID already exists")
      }
      await setDoc(ref, { ...data, created_at: Timestamp.now() })
    },
    onMutate: async ({ id, data }) => {
      console.log("%c[useBranches] Optimistic update (createBranch)", "color: green; font-weight: bold;")
      await queryClient.cancelQueries({ queryKey: ["branches"] })
      const prev = queryClient.getQueryData<BranchData[]>(["branches"]) || []
      const optimistic: BranchData = {
        id,
        ...data,
        created_at: new Date(),
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
      if (!(await getDoc(ref)).exists()) {
        throw new Error("Branch does not exist")
      }
      await updateDoc(ref, data)
    },
    onMutate: async ({ id, data }) => {
      console.log("%c[useBranches] Optimistic update (updateBranch)", "color: green; font-weight: bold;")
      await queryClient.cancelQueries({ queryKey: ["branches"] })
      const prev = queryClient.getQueryData<BranchData[]>(["branches"]) || []
      queryClient.setQueryData<BranchData[]>(
        ["branches"],
        prev.map((b) => (b.id === id ? { ...b, ...data } : b)),
      )
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
      if (!(await getDoc(ref)).exists()) {
        throw new Error("Branch does not exist")
      }
      await deleteDoc(ref)
    },
    onMutate: async (id) => {
      console.log("%c[useBranches] Optimistic update (deleteBranch)", "color: green; font-weight: bold;")
      await queryClient.cancelQueries({ queryKey: ["branches"] })
      const prev = queryClient.getQueryData<BranchData[]>(["branches"]) || []
      queryClient.setQueryData(
        ["branches"],
        prev.filter((b) => b.id !== id),
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      console.log("%c[useBranches] Rolling back optimistic deleteBranch.", "color: red; font-weight: bold;")
      if (ctx?.prev) queryClient.setQueryData(["branches"], ctx.prev)
    },
  })

  return {
    ...queryResult,
    createBranch,
    updateBranch,
    deleteBranch,
  }
}

"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import {
  fetchBranches,
  fetchBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  subscribeToBranches,
} from "@/lib/branches-api"
import type { BranchData } from "@/types/branch"

// Query keys
export const branchesKeys = {
  all: ["branches"] as const,
  lists: () => [...branchesKeys.all, "list"] as const,
  list: (filters: string) => [...branchesKeys.lists(), { filters }] as const,
  details: () => [...branchesKeys.all, "detail"] as const,
  detail: (id: string) => [...branchesKeys.details(), id] as const,
}

// Fetch all branches with real-time updates
export function useBranches() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: branchesKeys.lists(),
    queryFn: fetchBranches,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToBranches((branches) => {
      queryClient.setQueryData(branchesKeys.lists(), branches)
    })

    return unsubscribe
  }, [queryClient])

  return query
}

// Fetch single branch
export function useBranch(id: string) {
  return useQuery({
    queryKey: branchesKeys.detail(id),
    queryFn: () => fetchBranch(id),
    enabled: !!id,
  })
}

// Create branch mutation
export function useCreateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      // Invalidate and refetch branches list
      queryClient.invalidateQueries({ queryKey: branchesKeys.lists() })
    },
    onError: (error) => {
      console.error("Failed to create branch:", error)
    },
  })
}

// Update branch mutation
export function useUpdateBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<BranchData, "id" | "created_at">> }) =>
      updateBranch(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate both the list and the specific branch
      queryClient.invalidateQueries({ queryKey: branchesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: branchesKeys.detail(id) })
    },
    onError: (error) => {
      console.error("Failed to update branch:", error)
    },
  })
}

// Delete branch mutation
export function useDeleteBranch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteBranch,
    onSuccess: (_, id) => {
      // Remove from cache and invalidate list
      queryClient.removeQueries({ queryKey: branchesKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: branchesKeys.lists() })
    },
    onError: (error) => {
      console.error("Failed to delete branch:", error)
    },
  })
}

// Optimistic updates helper
export function useOptimisticBranchUpdate() {
  const queryClient = useQueryClient()

  const updateBranchOptimistically = (id: string, updates: Partial<BranchData>) => {
    queryClient.setQueryData(branchesKeys.lists(), (old: BranchData[] | undefined) => {
      if (!old) return old
      return old.map((branch) => (branch.id === id ? { ...branch, ...updates } : branch))
    })

    queryClient.setQueryData(branchesKeys.detail(id), (old: BranchData | undefined) => {
      if (!old) return old
      return { ...old, ...updates }
    })
  }

  return { updateBranchOptimistically }
}

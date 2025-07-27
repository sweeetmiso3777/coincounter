"use client";
import { useBranches } from "@/hooks/useBranches";
import { BranchCard } from "@/components/branch-card";
import { AddBranchCard } from "@/components/add-branch-card";
import { DashboardStats } from "@/components/dashboard-stats";
import { Loader2, AlertCircle } from "lucide-react";

export default function Branches() {
  const { branches, loading, error } = useBranches();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Loading Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Please wait while we load your branch data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Error Connecting to Database
          </h1>
          <p className="text-gray-600 mt-2">Try Reloading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Branch Management Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and monitor all your agricultural branches
          </p>
        </div>

        {/* Stats */}
        {branches.length > 0 && <DashboardStats branches={branches} />}

        {/* Branches Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            All Branches ({branches.length})
          </h2>

          {branches.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No branches found
                </h3>
                <p className="text-gray-500 mb-6">
                  Get started by creating your first branch to track harvests
                  and manage operations.
                </p>
                <AddBranchCard />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Branch Cards */}
              {branches.map((branch) => (
                <BranchCard key={branch.id} branch={branch} />
              ))}
              {/* Add Branch Card - Always Last */}
              <AddBranchCard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

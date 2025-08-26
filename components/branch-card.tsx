import { CalendarDays, MapPin, User, TrendingUp } from "lucide-react";
import { CardMenu } from "./card-menu";
import type { BranchData } from "@/types/branch";

interface BranchCardProps {
  branch: BranchData;
}

export function BranchCard({ branch }: BranchCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6 h-full flex flex-col min-h-[280px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 truncate mb-1">
              {branch.id}
            </h3>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">
                {branch.location}
              </span>
            </div>
          </div>
          <CardMenu branchId={branch.id} branchData={branch} />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3 mt-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">Manager:</span>
            <span className="text-sm text-gray-600 truncate">
              {branch.branch_manager}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">Share:</span>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
              {branch.share}%
            </span>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Created:
              </span>
              <span className="text-sm text-gray-600">
                {formatDate(branch.created_at)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Harvest:
              </span>
              <span className="text-sm text-gray-600">
                {formatDate(branch.date_of_harvest)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

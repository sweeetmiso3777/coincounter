"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ArrowDownRight,
  MoreVertical,
  User,
  Calendar,
  Shield,
} from "lucide-react";
import { useUser } from "@/providers/UserProvider";

interface UserData {
  id: string;
  email: string;
  role: string;
  status: "pending" | "approved" | "rejected" | "blacklisted";
  requestedAt?: Timestamp;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [users, setUsers] = useState<UserData[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (user.status !== "approved") {
        router.push("/sorry");
      } else if (user.role !== "admin") {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        const fetchedUsers: UserData[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<UserData, "id">),
        }));

        const sortedUsers = fetchedUsers.sort((a, b) => {
          if (a.role === "admin" && b.role !== "admin") return -1;
          if (a.role !== "admin" && b.role === "admin") return 1;
          return 0;
        });

        setUsers(sortedUsers);
      });

      return () => unsubscribe();
    }
  }, [user]);

  if (loading || !user || user.status !== "approved" || user.role !== "admin") {
    return null;
  }

  const updateRole = async (userId: string, role: string) => {
    await updateDoc(doc(db, "users", userId), { role });
  };

  const approveUser = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), { status: "approved" });
  };

  const deleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await deleteDoc(doc(db, "users", userId));
    }
  };

  const blacklistUser = async (userId: string) => {
    if (confirm("Blacklist this user? They will be restricted from access.")) {
      await updateDoc(doc(db, "users", userId), { status: "blacklisted" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 dark:text-green-400";
      case "blacklisted":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-orange-600 dark:text-orange-400";
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-3">
      <h1 className="text-xl font-bold mb-4 text-foreground px-2">
        Users Settings
      </h1>

      {users.map((u) => (
        <div
          key={u.id}
          className="border rounded-lg p-3 shadow-sm bg-card text-card-foreground border-border"
        >
          {/* Main Content - Stacked for mobile */}
          <div className="flex flex-col space-y-3">
            {/* Email and Role */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User size={16} className="text-muted-foreground" />
                  <span className="font-semibold truncate">{u.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Role: {u.role || "Not set"}
                  </span>
                </div>
              </div>

              {/* Status Badge - Mobile */}
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(
                  u.status
                )} bg-opacity-10`}
              >
                {u.status}
              </span>
            </div>

            {/* Request Date */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar size={12} />
              <span>
                Requested:{" "}
                {u.requestedAt?.toDate
                  ? u.requestedAt.toDate().toLocaleDateString()
                  : "N/A"}
              </span>
            </div>

            {/* Action Buttons - Stacked on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
              {/* Role Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 justify-center text-xs"
                  >
                    Set Role <ArrowDownRight size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => updateRole(u.id, "partner")}>
                    Partner
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateRole(u.id, "admin")}>
                    Admin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Action Buttons Group */}
              <div className="flex gap-2">
                {u.status !== "approved" && u.status !== "blacklisted" && (
                  <Button
                    onClick={() => approveUser(u.id)}
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700 flex-1 text-xs"
                  >
                    Approve
                  </Button>
                )}

                {u.status === "approved" && u.role !== "admin" && (
                  <Button
                    onClick={() => blacklistUser(u.id)}
                    size="sm"
                    className="bg-yellow-600 text-white hover:bg-yellow-700 flex-1 text-xs"
                  >
                    Blacklist
                  </Button>
                )}

                {u.role !== "admin" && (
                  <Button
                    onClick={() => deleteUser(u.id)}
                    size="sm"
                    className="bg-red-600 text-white hover:bg-red-700 flex-1 text-xs"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

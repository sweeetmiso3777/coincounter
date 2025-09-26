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
import { ArrowDownRight } from "lucide-react";
import { useUsers } from "@/hooks/use-users"; // ⬅️ your hook

interface UserData {
  id: string;
  email: string;
  role: string;
  status: "pending" | "approved" | "rejected" | "blacklisted";
  requestedAt?: Timestamp;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useUsers(); // ⬅️ current logged-in user
  const [users, setUsers] = useState<UserData[]>([]);

  // 🚨 Restrict access: only admins
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/"); // not logged in → home
      } else if (user.status !== "approved") {
        router.push("/sorry"); // pending/rejected → sorry page
      } else if (user.role !== "admin") {
        router.push("/"); // approved but not admin → block
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
    return null; // prevent flash
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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4 text-foreground">
        Users Settings
      </h1>
      {users.map((user) => (
        <div
          key={user.id}
          className="flex justify-between items-center border rounded-xl p-4 shadow-sm 
                     bg-card text-card-foreground border-border"
        >
          <div className="flex flex-col">
            <span className="font-semibold">{user.email}</span>
            <span className="text-sm text-muted-foreground">
              Requested At:{" "}
              {user.requestedAt?.toDate
                ? user.requestedAt.toDate().toLocaleString()
                : "N/A"}
            </span>
            <span className="text-sm">
              Status:{" "}
              <span
                className={`font-bold ${
                  user.status === "approved"
                    ? "text-green-600 dark:text-green-400"
                    : user.status === "blacklisted"
                    ? "text-red-600 dark:text-red-400"
                    : "text-orange-600 dark:text-orange-400"
                }`}
              >
                {user.status}
              </span>
            </span>
          </div>

          <div className="flex gap-4 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  {user.role || "Set Role"} <ArrowDownRight size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => updateRole(user.id, "partner")}
                >
                  Partner
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateRole(user.id, "admin")}>
                  Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user.status !== "approved" && user.status !== "blacklisted" && (
              <Button
                onClick={() => approveUser(user.id)}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Approve
              </Button>
            )}

            {user.status === "approved" && user.role !== "admin" && (
              <Button
                onClick={() => blacklistUser(user.id)}
                className="bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Blacklist
              </Button>
            )}

            {user.role !== "admin" && (
              <Button
                onClick={() => deleteUser(user.id)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

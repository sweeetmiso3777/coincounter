"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface UserData {
  email: string;
  role: "admin" | "partner" | "";
  status: "pending" | "approved" | "rejected" | "blacklisted";
}

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  isApproved: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  isApproved: false,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);

      // Clean up any existing snapshot listener
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!firebaseUser) {
        console.log("No user - clearing state");
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        console.log(
          "Setting up real-time listener for user:",
          firebaseUser.uid
        );

        // Real-time listener for user document changes
        unsubscribeSnapshot = onSnapshot(
          userRef,
          (userSnap) => {
            console.log("User document updated:", userSnap.exists());

            if (userSnap.exists()) {
              const userData = userSnap.data() as UserData;
              console.log("New user data:", userData);

              setUser(userData);
              setLoading(false);
            } else {
              // User document doesn't exist (was deleted)
              console.log("User document deleted - signing out");
              setUser(null);
              setLoading(false);
              signOut(auth);
            }
          },
          (error) => {
            console.error("Snapshot error:", error);
            setLoading(false);
          }
        );

        // Check if document exists initially (handles new users)
        unsubscribeSnapshot = onSnapshot(
          userRef,
          { includeMetadataChanges: true }, // Get initial state
          (userSnap) => {
            if (!userSnap.exists()) {
              console.log("New user - creating document");
              // Create document for new users
              const newUser: UserData = {
                email: firebaseUser.email || "",
                role: "",
                status: "pending",
              };

              setDoc(userRef, {
                ...newUser,
                requestedAt: serverTimestamp(),
                approvedAt: null,
              }).catch(console.error);
            }
          }
        );
      } catch (err) {
        console.error("Error in UserProvider:", err);
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      console.log("Cleaning up listeners");
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
      unsubscribeAuth();
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        isApproved: user?.status === "approved",
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

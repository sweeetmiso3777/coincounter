"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../lib/firebase"

interface UserData {
  email: string
  role: string
  status: "pending" | "approved" | "rejected"
}

export function useUsers() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const data = userSnap.data() as UserData
          setUser(data)

          // if (data.status === "approved") {
          //   router.push("/dashboard")
          // } else {
          //   router.push("/sorry") // consistent route
          // }
        } else {
          // New user → create as pending
          await setDoc(userRef, {
            email: firebaseUser.email,
            role: "",
            status: "pending",
            requestedAt: serverTimestamp(),
            approvedAt: null,
          })
          router.push("/sorry") // use same route
        }


      } catch (err) {
        console.error("Error checking user status:", err)
        // On any error, treat as new user → create and redirect
        try {
          await setDoc(doc(db, "users", firebaseUser.uid), {
            email: firebaseUser.email,
            role: "",
            status: "pending",
            requestedAt: serverTimestamp(),
            approvedAt: null,
          })
        } catch {}
        router.push("/sorry")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const isApproved = user?.status === "approved"

  return { user, loading, isApproved }
}

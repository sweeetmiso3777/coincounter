"use client";

// src/hooks/use-backups-query.ts
import { useEffect, useState } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BackupDocument {
  id: string;
  branchId: string;
  deviceId: string;
  coins_1: number;
  coins_5: number;
  coins_10: number;
  coins_20: number;
  total: number;
  lastOnline: string;
  uploadedAt: Timestamp; // Firestore Timestamp
}

export function useBackupsQuery() {
  const [data, setData] = useState<BackupDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "backups"),
      (snap) => {
        setData(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<BackupDocument, "id">),
          }))
        );
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { data, loading, error };
}

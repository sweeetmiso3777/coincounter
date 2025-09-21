"use client";

import { useState, useEffect, useRef } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

interface Unit {
  deviceId: string;
  branchId?: string;
  [key: string]: unknown;
}

interface Branch {
  id: string;
  location: string;
}

export function UnitsTable() {
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [actionType, setActionType] = useState<
    "decommission" | "reassign" | null
  >(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const modalRef = useRef<HTMLDivElement>(null); // reference to modal container

  const unitsWithBranch = allUnits.filter((u) => u.branchId);
  const unitsWithoutBranch = allUnits.filter((u) => !u.branchId);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "Units"));
      const unitsData: Unit[] = snapshot.docs.map((d) => ({
        deviceId: d.id,
        ...d.data(),
      }));
      setAllUnits(unitsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch units");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    const snapshot = await getDocs(collection(db, "Branches"));
    const branchData: Branch[] = snapshot.docs.map((d) => ({
      id: d.id,
      location: d.data().location,
    }));
    setBranches(branchData);
  };

  useEffect(() => {
    fetchUnits();
    fetchBranches();
  }, []);

  // Close on ESC or click outside
  useEffect(() => {
    if (!confirmVisible) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmVisible(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setConfirmVisible(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [confirmVisible]);

  const handleAction = async () => {
    if (!selectedUnit) return;
    try {
      if (actionType === "decommission") {
        await updateDoc(doc(db, "Units", selectedUnit.deviceId), {
          branchId: null,
        });
        toast.success(`Unit ${selectedUnit.deviceId} decommissioned!`);
      } else if (actionType === "reassign" && selectedBranchId) {
        await updateDoc(doc(db, "Units", selectedUnit.deviceId), {
          branchId: selectedBranchId,
        });
        toast.success(`Unit ${selectedUnit.deviceId} reassigned!`);
      }
      setConfirmVisible(false);
      setConfirmInput("");
      setSelectedBranchId("");
      fetchUnits();
    } catch {
      toast.error("Action failed.");
    }
  };

  return (
    <>
      {/* Units with Branch Table */}
      <Card>
        <CardHeader>
          <CardTitle>Units with Branch</CardTitle>
          <CardDescription>
            {unitsWithBranch.length} assigned units
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unitsWithBranch.map((unit) => {
                const branchName =
                  branches.find((b) => b.id === unit.branchId)?.location ||
                  "Unknown";
                return (
                  <TableRow key={unit.deviceId}>
                    <TableCell>{unit.deviceId}</TableCell>
                    <TableCell>{branchName}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUnit(unit);
                          setActionType("reassign");
                          setConfirmVisible(true);
                        }}
                      >
                        Reassign
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUnit(unit);
                          setActionType("decommission");
                          setConfirmVisible(true);
                        }}
                      >
                        Decommission
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Units without Branch Table */}
      <Card>
        <CardHeader>
          <CardTitle>Units without Branch</CardTitle>
          <CardDescription>
            {unitsWithoutBranch.length} unassigned units
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unitsWithoutBranch.map((unit) => (
                <TableRow key={unit.deviceId}>
                  <TableCell>{unit.deviceId}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUnit(unit);
                        setActionType("reassign");
                        setConfirmVisible(true);
                      }}
                    >
                      Assign
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Card */}
      <AnimatePresence>
        {confirmVisible && selectedUnit && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50" // backdrop + centering
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop for dimming (optional) */}
            <div className="absolute inset-0 bg-black/30" />

            <motion.div
              ref={modalRef}
              className="relative w-96"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { duration: 0.25, ease: "easeOut" },
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                transition: { duration: 0.2, ease: "easeIn" },
              }}
            >
              <Card className="border border-red-500 bg-card p-4 shadow-lg">
                <CardHeader>
                  <CardTitle>
                    {actionType === "decommission"
                      ? "Confirm Decommission"
                      : "Confirm Reassign"}
                  </CardTitle>
                  <CardDescription>
                    Type <strong>CONFIRM</strong> to {actionType} unit{" "}
                    {selectedUnit.deviceId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {actionType === "reassign" && (
                    <select
                      className="w-full border rounded px-2 py-1 bg-card text-foreground dark:bg-card dark:text-foreground border-border"
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.location}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    className="border px-2 py-1 rounded"
                    placeholder="Type CONFIRM"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmVisible(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-secondary hover:bg-secondary/90 text-foreground"
                      variant="default"
                      size="sm"
                      disabled={
                        confirmInput !== "CONFIRM" ||
                        (actionType === "reassign" && !selectedBranchId)
                      }
                      onClick={handleAction}
                    >
                      Confirm
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

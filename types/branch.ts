import { Timestamp } from "firebase/firestore";

export interface Branch {
  id: string;
  branch_manager: string;
  created_at: Timestamp; // Firestore Timestamp
  harvest_day_of_month: number;
  location: string;
  share: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface BranchData {
  id: string;
  branch_manager: string;
  created_at: Date; // JS Date
  harvest_day_of_month: number;
  location: string;
  share: number;
  latitude?: number | null;
  longitude?: number | null;
}

import { Timestamp } from "firebase/firestore";


export interface Branch {
  id: string;
  branch_manager: string;
  created_at: Timestamp;
  last_harvest_date?: Timestamp | null;
  harvest_day_of_month: number;
  location: string;
  share: number;
  latitude?: number | null;
  longitude?: number | null;
  affiliates?: string[]; 
}

//  frontend-friendly shape
export interface BranchData {
  id: string;
  branch_manager: string;
  created_at: Date; // JS Date
  last_harvest_date?: Date | null; // JS Date or null
  harvest_day_of_month: number;
  location: string;
  share: number;
  totalUnits: number;
  latitude?: number | null;
  longitude?: number | null;
  affiliates?: string[];
  address?: string;
  contact_number?: string;
  name?: string;
  branchName?: string;
  managerName?: string;
  contactNumber?: string;
  phone?: string;

}

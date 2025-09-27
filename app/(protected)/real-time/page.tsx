import { RealTimePage } from "@/components/real-time/real-time-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real-Time Sales",
  description: "View real-time sales data and updates instantly.",
};

export default function RealTimeSalesPage() {
  return <RealTimePage />;
}

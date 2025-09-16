"use client";

import { toast } from "sonner";

export function ToastTester() {
  return (
    <div className="fixed bottom-6 right-6">
      <button
        onClick={() =>
          toast.success("This is a test toast 🚀", {
            style: {
              background: "#dcfce7",
              border: "1px solid #bbf7d0",
              color: "#166534",
            },
          })
        }
        className="px-4 py-2 rounded-md bg-green-600 text-white font-medium shadow hover:bg-green-700 transition"
      >
        Show Test Toast
      </button>
    </div>
  );
}

"use client";

import { exportCSV } from "../utils/export";
import { Physician } from "../types";

type ExportButtonsProps = {
  physicians: Physician[];
};

export default function ExportButtons({ physicians }: ExportButtonsProps) {
  return (
    <div className="flex gap-2 mt-3">
      <button
        type="button"
        onClick={() => exportCSV(physicians)}
        disabled={physicians.length === 0}
        className={`px-4 py-2 rounded text-white ${physicians.length === 0 ? "bg-gray-400" : "bg-green-600"}`}
      >
        Export CSV
      </button>
    </div>
  );
}
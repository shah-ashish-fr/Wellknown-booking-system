"use client";

import { useRouter } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardMonthSelectorProps {
  currentMonth: number; // 1 - 12
  currentYear: number;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function DashboardMonthSelector({
  currentMonth,
  currentYear,
}: DashboardMonthSelectorProps) {
  const router = useRouter();

  // Generate options from 2025 to 2027
  const options: Array<{ month: number; year: number; label: string; value: string }> = [];
  const years = [2025, 2026, 2027];
  for (const y of years) {
    for (let m = 1; m <= 12; m++) {
      options.push({
        month: m,
        year: y,
        label: `${MONTH_NAMES[m - 1]} ${y}`,
        value: `${y}-${m}`,
      });
    }
  }

  const selectedValue = `${currentYear}-${currentMonth}`;

  const handleChange = (val: string) => {
    const [y, m] = val.split("-");
    router.push(`/?month=${m}&year=${y}`);
  };

  const navigateMonth = (direction: -1 | 1) => {
    let nextMonth = currentMonth + direction;
    let nextYear = currentYear;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    router.push(`/?month=${nextMonth}&year=${nextYear}`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Monthly Performance Period
          </span>
          <span className="text-[11px] text-slate-500">
            Showing bookings and revenue for {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 self-start sm:self-auto">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-2xs"
          title="Previous Month"
          aria-label="Previous Month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="relative">
          <select
            value={selectedValue}
            onChange={(e) => handleChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 pr-8 text-xs font-bold text-slate-800 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer appearance-none"
            aria-label="Select Month and Year"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-2xs"
          title="Next Month"
          aria-label="Next Month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

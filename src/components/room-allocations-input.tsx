"use client";

import { useMemo } from "react";
import { RoomAllocation } from "@/types/booking";
import { ROOM_TYPE_OPTIONS } from "@/config/booking-options";
import { BedDouble, Plus, Minus, Check } from "lucide-react";

interface RoomAllocationsInputProps {
  value: RoomAllocation[];
  onChange: (allocations: RoomAllocation[]) => void;
  error?: string;
}

export default function RoomAllocationsInput({
  value,
  onChange,
  error,
}: RoomAllocationsInputProps) {
  // Ensure we have an active array
  const currentAllocations = useMemo(() => {
    if (Array.isArray(value) && value.length > 0) return value;
    return [{ roomType: ROOM_TYPE_OPTIONS[0], count: 1 }];
  }, [value]);

  // Collect all room types to display (standard options + any legacy ones in current value)
  const allAvailableTypes = useMemo(() => {
    const list: string[] = [...ROOM_TYPE_OPTIONS];
    for (const alloc of currentAllocations) {
      if (alloc.roomType && !list.includes(alloc.roomType)) {
        list.push(alloc.roomType);
      }
    }
    return list;
  }, [currentAllocations]);

  const toggleRoomType = (type: string) => {
    const exists = currentAllocations.find((a) => a.roomType === type);
    if (exists) {
      // If it's the only one selected, do not allow unselecting all
      if (currentAllocations.length === 1) {
        return;
      }
      onChange(currentAllocations.filter((a) => a.roomType !== type));
    } else {
      onChange([...currentAllocations, { roomType: type, count: 1 }]);
    }
  };

  const updateCount = (type: string, newCount: number) => {
    const count = Math.max(1, Math.min(99, newCount));
    const exists = currentAllocations.find((a) => a.roomType === type);
    if (exists) {
      onChange(
        currentAllocations.map((a) => (a.roomType === type ? { ...a, count } : a))
      );
    } else {
      onChange([...currentAllocations, { roomType: type, count }]);
    }
  };

  const totalRooms = currentAllocations.reduce((sum, a) => sum + (a.count || 1), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Room Types &amp; Allocation <span className="text-rose-500">*</span>
        </label>
        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
          Total: {totalRooms} {totalRooms === 1 ? "Room" : "Rooms"}
        </span>
      </div>

      <p className="text-xs text-slate-500">
        Select one or multiple room types and specify how many rooms of each type are needed:
      </p>

      {/* Grid of Room Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {allAvailableTypes.map((type) => {
          const allocation = currentAllocations.find((a) => a.roomType === type);
          const isSelected = !!allocation;
          const count = allocation?.count || 1;

          return (
            <div
              key={type}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50/40 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleRoomType(type)}
                className="flex items-center gap-2.5 text-left flex-1 select-none mr-2"
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-white transition-colors ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-600"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BedDouble className="h-3.5 w-3.5 text-slate-500" />
                    <span>{type}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {isSelected ? `${count} ${count === 1 ? "room" : "rooms"} selected` : "Click to include"}
                  </span>
                </div>
              </button>

              {/* Number stepper when selected */}
              {isSelected && (
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => updateCount(type, count - 1)}
                    disabled={count <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Decrease rooms"
                  >
                    <Minus className="h-3 w-3" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={count}
                    onChange={(e) => updateCount(type, parseInt(e.target.value, 10) || 1)}
                    className="w-10 text-center font-bold text-xs text-slate-900 focus:outline-none"
                    aria-label={`Number of ${type} rooms`}
                  />

                  <button
                    type="button"
                    onClick={() => updateCount(type, count + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                    title="Increase rooms"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

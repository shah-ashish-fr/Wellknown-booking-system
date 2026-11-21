"use client";

import { useMemo } from "react";
import { RoomAllocation, RoomPricing } from "@/types/booking";
import { ROOM_TYPE_OPTIONS } from "@/config/booking-options";
import { BedDouble, Plus, Minus, Check } from "lucide-react";

interface RoomAllocationsInputProps {
  value: RoomAllocation[];
  onChange: (allocations: RoomAllocation[]) => void;
  error?: string;
  /** Room pricing data (price per room per night for each selected type) */
  roomPricing?: RoomPricing[];
  onPricingChange?: (pricing: RoomPricing[]) => void;
  /** Number of nights (derived from check-in/check-out) */
  nights?: number;
}

export default function RoomAllocationsInput({
  value,
  onChange,
  error,
  roomPricing,
  onPricingChange,
  nights = 1,
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

  const getPriceForType = (roomType: string): number => {
    if (!roomPricing) return 0;
    const pricing = roomPricing.find((p) => p.roomType === roomType);
    return pricing?.pricePerNight || 0;
  };

  const emitPricingUpdate = (
    allocations: RoomAllocation[],
    updatedType?: string,
    updatedPrice?: number
  ) => {
    if (!onPricingChange) return;
    const effectiveNights = Math.max(1, nights);
    const newPricing: RoomPricing[] = allocations.map((a) => {
      const existingPrice =
        a.roomType === updatedType && updatedPrice !== undefined
          ? updatedPrice
          : getPriceForType(a.roomType);
      return {
        roomType: a.roomType,
        count: a.count,
        pricePerNight: existingPrice,
        nights: effectiveNights,
        subtotal: a.count * existingPrice * effectiveNights,
      };
    });
    onPricingChange(newPricing);
  };

  const toggleRoomType = (type: string) => {
    const exists = currentAllocations.find((a) => a.roomType === type);
    if (exists) {
      // If it's the only one selected, do not allow unselecting all
      if (currentAllocations.length === 1) {
        return;
      }
      const newAllocations = currentAllocations.filter((a) => a.roomType !== type);
      onChange(newAllocations);
      emitPricingUpdate(newAllocations);
    } else {
      const newAllocations = [...currentAllocations, { roomType: type, count: 1 }];
      onChange(newAllocations);
      emitPricingUpdate(newAllocations);
    }
  };

  const updateCount = (type: string, newCount: number) => {
    const count = Math.max(1, Math.min(99, newCount));
    const exists = currentAllocations.find((a) => a.roomType === type);
    let newAllocations: RoomAllocation[];
    if (exists) {
      newAllocations = currentAllocations.map((a) =>
        a.roomType === type ? { ...a, count } : a
      );
    } else {
      newAllocations = [...currentAllocations, { roomType: type, count }];
    }
    onChange(newAllocations);
    emitPricingUpdate(newAllocations);
  };

  const updatePrice = (type: string, price: number) => {
    const cleanPrice = Math.max(0, price);
    emitPricingUpdate(currentAllocations, type, cleanPrice);
  };

  const totalRooms = currentAllocations.reduce((sum, a) => sum + (a.count || 1), 0);
  const totalRoomCharges = (roomPricing || []).reduce((sum, p) => sum + (p.subtotal || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Room Types &amp; Allocation <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {totalRoomCharges > 0 && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              ₹{totalRoomCharges.toLocaleString("en-IN")}
            </span>
          )}
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
            Total: {totalRooms} {totalRooms === 1 ? "Room" : "Rooms"}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Select one or multiple room types, specify rooms and price per room per night:
      </p>

      {/* Grid of Room Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {allAvailableTypes.map((type) => {
          const allocation = currentAllocations.find((a) => a.roomType === type);
          const isSelected = !!allocation;
          const count = allocation?.count || 1;
          const pricePerNight = getPriceForType(type);
          const effectiveNights = Math.max(1, nights);
          const lineSubtotal = count * pricePerNight * effectiveNights;

          return (
            <div
              key={type}
              className={`flex flex-col p-3 rounded-xl border transition-all ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50/40 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
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

              {/* Price per room per night input — only when selected */}
              {isSelected && onPricingChange && (
                <div className="mt-2 pt-2 border-t border-indigo-200/60">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      ₹ / Room / Night
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={pricePerNight || ""}
                        onChange={(e) => updatePrice(type, Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-28 rounded-md border border-slate-300 bg-white pl-6 pr-2 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                        aria-label={`Price per ${type} room per night`}
                      />
                    </div>
                  </div>
                  {lineSubtotal > 0 && (
                    <div className="mt-1 text-right">
                      <span className="text-[10px] text-slate-500">
                        {count} × ₹{pricePerNight.toLocaleString("en-IN")} × {effectiveNights} {effectiveNights === 1 ? "night" : "nights"} ={" "}
                      </span>
                      <span className="text-xs font-bold text-indigo-800">
                        ₹{lineSubtotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
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

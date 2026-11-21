"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Calendar,
  CreditCard,
  FileText,
  Loader2,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
} from "lucide-react";
import { updateBooking, BookingFormData } from "@/app/actions/booking";
import { PaymentStatus, BookingSource, RoomAllocation, RoomPricing, MealSelection } from "@/types/booking";
import {
  GUEST_TITLE_OPTIONS,
  ROOM_TYPE_OPTIONS,
  TRAVEL_AGENTS,
} from "@/config/booking-options";
import {
  parseRoomAllocations,
  formatRoomAllocationsSummary,
  getTotalRoomCount,
} from "@/lib/room-allocations";
import RoomAllocationsInput from "@/components/room-allocations-input";
import MealSelectionsInput from "@/components/meal-selections-input";
import BookingCalculator from "@/components/booking-calculator";

interface HotelOption {
  id: string;
  name: string;
  location: string;
}

interface EditBookingFormProps {
  id: string;
  hotels: HotelOption[];
  initialData: {
    hotelId: string;
    guestTitle?: string | null;
    guestName: string;
    guestPhone: string;
    bookingId: string;
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
    adults: number;
    children: number;
    rooms: number;
    roomType: string;
    roomAllocations?: RoomAllocation[] | null;
    roomPricing?: RoomPricing[] | null;
    mealSelections?: MealSelection[] | null;
    totalAmount: number;
    gstAmount: number;
    advanceAmount: number;
    paymentStatus: PaymentStatus;
    bookingSource: BookingSource;
    travelAgent?: string | null;
    includeInExcel?: boolean;
    notes?: string;
  };
}

/**
 * Strip +91 prefix from a stored phone number so we display only the 10-digit part.
 */
function stripCountryCode(phone: string): string {
  let p = (phone || "").replace(/\s+/g, "");
  if (p.startsWith("+91")) p = p.slice(3);
  else if (p.startsWith("91") && p.length > 10) p = p.slice(2);
  return p.replace(/\D/g, "").slice(0, 10);
}

export default function EditBookingForm({ id, hotels, initialData }: EditBookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Safely parse initial room pricing & meals
  const parsedInitialPricing: RoomPricing[] = Array.isArray(initialData.roomPricing)
    ? initialData.roomPricing
    : typeof initialData.roomPricing === "string"
    ? (() => { try { return JSON.parse(initialData.roomPricing); } catch { return []; } })()
    : [];

  const parsedInitialMeals: MealSelection[] = Array.isArray(initialData.mealSelections)
    ? initialData.mealSelections
    : typeof initialData.mealSelections === "string"
    ? (() => { try { return JSON.parse(initialData.mealSelections); } catch { return []; } })()
    : [];

  const initialRoomCharges = parsedInitialPricing.reduce((sum, p) => sum + (p.subtotal || 0), 0);
  const initialMealCharges = parsedInitialMeals.reduce((sum, m) => sum + (m.subtotal || 0), 0);
  const initialExtra = (initialRoomCharges > 0 || initialMealCharges > 0)
    ? Math.max(0, initialData.totalAmount - initialRoomCharges - initialMealCharges)
    : 0;

  const [extraCharges, setExtraCharges] = useState<number>(initialExtra);

  const initialAllocations = parseRoomAllocations(initialData.roomAllocations, initialData.roomType, initialData.rooms);

  const [formData, setFormData] = useState<BookingFormData>({
    hotelId: initialData.hotelId,
    guestTitle: initialData.guestTitle || "",
    guestName: initialData.guestName,
    guestPhone: stripCountryCode(initialData.guestPhone),
    bookingId: initialData.bookingId,
    checkIn: initialData.checkIn,
    checkOut: initialData.checkOut,
    adults: initialData.adults,
    children: initialData.children,
    rooms: initialData.rooms,
    roomType: initialData.roomType,
    roomAllocations: initialAllocations,
    roomPricing: parsedInitialPricing,
    mealSelections: parsedInitialMeals,
    totalAmount: initialData.totalAmount,
    gstAmount: initialData.gstAmount,
    advanceAmount: initialData.advanceAmount,
    paymentStatus: initialData.paymentStatus,
    bookingSource: initialData.bookingSource,
    travelAgent: initialData.travelAgent || "",
    includeInExcel: initialData.includeInExcel !== false,
    notes: initialData.notes || "",
  });

  // Check if selected hotel is Hotel Shree Kesari Nandan
  const selectedHotel = hotels.find((h) => h.id === formData.hotelId);
  const isMealHotel = selectedHotel?.name?.toLowerCase().includes("kesari") ?? false;

  // Calculate nights
  const calculateNights = (inDateStr?: string, outDateStr?: string) => {
    const checkIn = inDateStr || formData.checkIn;
    const checkOut = outDateStr || formData.checkOut;
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    if (diff < 0) return 0;
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();

  // Computations
  const totalRoomCharges = (formData.roomPricing || []).reduce((sum, p) => sum + (p.subtotal || 0), 0);
  const totalMealCharges = isMealHotel
    ? (formData.mealSelections || []).reduce((sum, m) => sum + (m.subtotal || 0), 0)
    : 0;

  const handleRoomAllocationsChange = (allocations: RoomAllocation[]) => {
    const total = getTotalRoomCount(allocations);
    const summary = formatRoomAllocationsSummary(allocations);
    const effectiveNights = Math.max(1, nights);

    setFormData((prev) => {
      const currentPricing = prev.roomPricing || [];
      const updatedPricing: RoomPricing[] = allocations.map((a) => {
        const existing = currentPricing.find((p) => p.roomType === a.roomType);
        const price = existing?.pricePerNight || 0;
        return {
          roomType: a.roomType,
          count: a.count,
          pricePerNight: price,
          nights: effectiveNights,
          subtotal: a.count * price * effectiveNights,
        };
      });

      const roomTotal = updatedPricing.reduce((sum, p) => sum + (p.subtotal || 0), 0);
      const mealTotal = isMealHotel
        ? (prev.mealSelections || []).reduce((sum, m) => sum + (m.subtotal || 0), 0)
        : 0;

      const updated = {
        ...prev,
        rooms: total,
        roomType: summary,
        roomAllocations: allocations,
        roomPricing: updatedPricing,
        totalAmount: (roomTotal > 0 || mealTotal > 0) ? (roomTotal + mealTotal + extraCharges) : prev.totalAmount,
      };

      const currentGrand = updated.totalAmount + Number(updated.gstAmount || 0);
      const advance = Number(updated.advanceAmount || 0);
      if (advance <= 0) {
        updated.paymentStatus = PaymentStatus.PENDING;
      } else if (advance >= currentGrand && currentGrand > 0) {
        updated.paymentStatus = PaymentStatus.FULLY_PAID;
      } else {
        updated.paymentStatus = PaymentStatus.ADVANCE_PAID;
      }
      return updated;
    });

    if (errors.rooms) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.rooms;
        return next;
      });
    }
  };

  // Handle room pricing change
  const handlePricingChange = (pricing: RoomPricing[]) => {
    const roomTotal = pricing.reduce((sum, p) => sum + (p.subtotal || 0), 0);
    const mealTotal = isMealHotel
      ? (formData.mealSelections || []).reduce((sum, m) => sum + (m.subtotal || 0), 0)
      : 0;
    const newTotal = roomTotal + mealTotal + extraCharges;

    setFormData((prev) => {
      const updated = {
        ...prev,
        roomPricing: pricing,
        totalAmount: (roomTotal > 0 || mealTotal > 0) ? newTotal : prev.totalAmount,
      };
      const currentGrand = updated.totalAmount + Number(updated.gstAmount || 0);
      const advance = Number(updated.advanceAmount || 0);
      if (advance <= 0) {
        updated.paymentStatus = PaymentStatus.PENDING;
      } else if (advance >= currentGrand && currentGrand > 0) {
        updated.paymentStatus = PaymentStatus.FULLY_PAID;
      } else {
        updated.paymentStatus = PaymentStatus.ADVANCE_PAID;
      }
      return updated;
    });

    if (errors.totalAmount) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.totalAmount;
        return next;
      });
    }
  };

  // Handle meal selections change
  const handleMealSelectionsChange = (meals: MealSelection[]) => {
    const mealTotal = meals.reduce((sum, m) => sum + (m.subtotal || 0), 0);
    const roomTotal = (formData.roomPricing || []).reduce((sum, p) => sum + (p.subtotal || 0), 0);
    const newTotal = roomTotal + mealTotal + extraCharges;

    setFormData((prev) => {
      const updated = {
        ...prev,
        mealSelections: meals,
        totalAmount: (roomTotal > 0 || mealTotal > 0) ? newTotal : prev.totalAmount,
      };
      const currentGrand = updated.totalAmount + Number(updated.gstAmount || 0);
      const advance = Number(updated.advanceAmount || 0);
      if (advance <= 0) {
        updated.paymentStatus = PaymentStatus.PENDING;
      } else if (advance >= currentGrand && currentGrand > 0) {
        updated.paymentStatus = PaymentStatus.FULLY_PAID;
      } else {
        updated.paymentStatus = PaymentStatus.ADVANCE_PAID;
      }
      return updated;
    });

    if (errors.totalAmount) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.totalAmount;
        return next;
      });
    }
  };

  // Handle extra charges change
  const handleExtraChargesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    setExtraCharges(val);
    if (totalRoomCharges > 0 || totalMealCharges > 0) {
      const newTotal = totalRoomCharges + totalMealCharges + val;
      setFormData((prev) => {
        const updated = { ...prev, totalAmount: newTotal };
        const currentGrand = newTotal + Number(updated.gstAmount || 0);
        const advance = Number(updated.advanceAmount || 0);
        if (advance <= 0) {
          updated.paymentStatus = PaymentStatus.PENDING;
        } else if (advance >= currentGrand && currentGrand > 0) {
          updated.paymentStatus = PaymentStatus.FULLY_PAID;
        } else {
          updated.paymentStatus = PaymentStatus.ADVANCE_PAID;
        }
        return updated;
      });
    }
  };

  // Travel Agent state
  const isKnownAgent =
    Boolean(initialData.travelAgent &&
    TRAVEL_AGENTS.includes(initialData.travelAgent) &&
    initialData.travelAgent !== "Other");
  const [selectedTravelAgent, setSelectedTravelAgent] = useState<string>(
    isKnownAgent ? initialData.travelAgent! : "Other"
  );
  const [manualTravelAgent, setManualTravelAgent] = useState<string>(
    isKnownAgent ? "" : (initialData.travelAgent || "")
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const grandTotal = Number(formData.totalAmount || 0) + Number(formData.gstAmount || 0);
  const balanceDue = Math.max(0, grandTotal - Number(formData.advanceAmount || 0));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (name === "hotelId") {
      const nextHotel = hotels.find((h) => h.id === value);
      const nextIsMealHotel = nextHotel?.name?.toLowerCase().includes("kesari") ?? false;

      setFormData((prev) => {
        const nextMeals = nextIsMealHotel ? prev.mealSelections : [];
        const mealTotal = nextIsMealHotel
          ? (nextMeals || []).reduce((sum, m) => sum + (m.subtotal || 0), 0)
          : 0;
        const roomTotal = (prev.roomPricing || []).reduce((sum, p) => sum + (p.subtotal || 0), 0);

        return {
          ...prev,
          hotelId: value,
          mealSelections: nextMeals,
          totalAmount: (roomTotal > 0 || mealTotal > 0) ? (roomTotal + mealTotal + extraCharges) : prev.totalAmount,
        };
      });
      return;
    }

    if (name === "checkIn" || name === "checkOut") {
      const newCheckIn = name === "checkIn" ? value : formData.checkIn;
      const newCheckOut = name === "checkOut" ? value : formData.checkOut;
      const effectiveNights = calculateNights(newCheckIn, newCheckOut);

      setFormData((prev) => {
        const updatedPricing = (prev.roomPricing || []).map((p) => ({
          ...p,
          nights: effectiveNights,
          subtotal: p.count * p.pricePerNight * effectiveNights,
        }));
        const roomTotal = updatedPricing.reduce((sum, p) => sum + (p.subtotal || 0), 0);
        const mealTotal = isMealHotel
          ? (prev.mealSelections || []).reduce((sum, m) => sum + (m.subtotal || 0), 0)
          : 0;

        const updated = {
          ...prev,
          [name]: value,
          roomPricing: updatedPricing,
          totalAmount: (roomTotal > 0 || mealTotal > 0) ? (roomTotal + mealTotal + extraCharges) : prev.totalAmount,
        };

        const currentGrand = updated.totalAmount + Number(updated.gstAmount || 0);
        const advance = Number(updated.advanceAmount || 0);
        if (advance <= 0) {
          updated.paymentStatus = PaymentStatus.PENDING;
        } else if (advance >= currentGrand && currentGrand > 0) {
          updated.paymentStatus = PaymentStatus.FULLY_PAID;
        } else {
          updated.paymentStatus = PaymentStatus.ADVANCE_PAID;
        }
        return updated;
      });
      return;
    }

    if (
      name === "adults" ||
      name === "children" ||
      name === "rooms" ||
      name === "totalAmount" ||
      name === "gstAmount" ||
      name === "advanceAmount"
    ) {
      const numVal = value === "" ? 0 : Number(value);
      setFormData((prev) => {
        const updated = {
          ...prev,
          [name]: numVal,
        };

        if (name === "totalAmount" || name === "gstAmount" || name === "advanceAmount") {
          const newTotal =
            name === "totalAmount" ? numVal : Number(updated.totalAmount || 0);
          const newGst =
            name === "gstAmount" ? numVal : Number(updated.gstAmount || 0);
          const newAdvance =
            name === "advanceAmount" ? numVal : Number(updated.advanceAmount || 0);
          const currentGrand = newTotal + newGst;

          if (newAdvance <= 0) {
            updated.paymentStatus = PaymentStatus.PENDING;
          } else if (newAdvance >= currentGrand && currentGrand > 0) {
            updated.paymentStatus = PaymentStatus.FULLY_PAID;
          } else {
            updated.paymentStatus = PaymentStatus.ADVANCE_PAID;
          }
        }

        return updated;
      });
      return;
    }

    // Handle booking source change
    if (name === "bookingSource") {
      setFormData((prev) => ({
        ...prev,
        bookingSource: value as BookingSource,
        travelAgent: value === BookingSource.TRAVEL_AGENT ? prev.travelAgent : "",
      }));
      if (value !== BookingSource.TRAVEL_AGENT) {
        setSelectedTravelAgent("Other");
        setManualTravelAgent("");
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Phone number handler: only allow digits, max 10
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    const trimmed = digits.slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      guestPhone: trimmed,
    }));
    if (errors.guestPhone) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.guestPhone;
        return next;
      });
    }
  };

  // Travel agent dropdown handler
  const handleTravelAgentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTravelAgent(val);
    if (val !== "Other") {
      setManualTravelAgent("");
      setFormData((prev) => ({ ...prev, travelAgent: val }));
    } else {
      setFormData((prev) => ({ ...prev, travelAgent: manualTravelAgent }));
    }
  };

  // Manual travel agent text input
  const handleManualAgentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualTravelAgent(val);
    setFormData((prev) => ({ ...prev, travelAgent: val }));
  };

  const validateClientSide = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.guestName.trim()) {
      newErrors.guestName = "Guest name is required.";
    }

    if (!formData.hotelId) {
      newErrors.hotelId = "Please select a hotel.";
    }

    if (!formData.checkIn) {
      newErrors.checkIn = "Check-in date is required.";
    }

    if (!formData.checkOut) {
      newErrors.checkOut = "Check-out date is required.";
    } else if (formData.checkIn && formData.checkOut <= formData.checkIn) {
      newErrors.checkOut = "Check-out must be after check-in date.";
    }

    if (formData.adults < 1) {
      newErrors.adults = "At least 1 adult is required.";
    }

    if (formData.children < 0) {
      newErrors.children = "Children cannot be negative.";
    }

    if (formData.rooms < 1) {
      newErrors.rooms = "At least 1 room is required.";
    }

    if (formData.totalAmount < 0) {
      newErrors.totalAmount = "Amount cannot be negative.";
    }

    if (formData.advanceAmount < 0) {
      newErrors.advanceAmount = "Advance cannot be negative.";
    }

    // Phone validation: must be 10 digits if provided
    if (formData.guestPhone && formData.guestPhone.length !== 10) {
      newErrors.guestPhone = "Please enter a valid 10-digit mobile number.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateClientSide()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Build submission data — prepend +91 to phone for storage
    const submissionData: BookingFormData = {
      ...formData,
      guestPhone: formData.guestPhone ? `+91${formData.guestPhone}` : "",
    };

    startTransition(async () => {
      try {
        const result = await updateBooking(id, submissionData);

        if (result.success) {
          setSuccessMessage("Booking updated successfully! Redirecting...");
          setTimeout(() => {
            router.push(`/bookings/${id}?updated=true`);
          }, 450);
        } else {
          if (result.errors) {
            setErrors(result.errors);
          }
          setServerError(result.message || "Failed to update booking. Please check your inputs.");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (err: unknown) {
        console.error(err);
        setServerError("An unexpected error occurred while saving changes.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const selectClass = (hasError: boolean) =>
    `mt-1.5 block w-full rounded-lg border px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-2xs focus:outline-none focus:ring-2 min-h-[44px] ${
      hasError
        ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
        : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100"
    }`;

  const inputClass = (hasError: boolean) =>
    `mt-1.5 block w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 min-h-[44px] ${
      hasError
        ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
        : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100"
    }`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-8">
        <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Banner for Server Messages */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{successMessage}</p>
        </div>
      )}

      {serverError && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-xs animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-sm font-semibold">{serverError}</p>
        </div>
      )}

      {/* SECTION 1: GUEST INFORMATION */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Guest Information</h2>
            <p className="text-xs text-slate-500">Primary guest identity and contact details</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Title + Guest Name row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[140px_1fr]">
            {/* Guest Title Dropdown */}
            <div>
              <label htmlFor="guestTitle" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Title
              </label>
              <select
                id="guestTitle"
                name="guestTitle"
                value={formData.guestTitle || ""}
                onChange={handleInputChange}
                className={selectClass(false)}
              >
                <option value="">— Select —</option>
                {GUEST_TITLE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Guest Name */}
            <div>
              <label htmlFor="guestName" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Guest Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="guestName"
                name="guestName"
                value={formData.guestName}
                onChange={handleInputChange}
                placeholder="e.g. Rajesh Kumar"
                className={inputClass(!!errors.guestName)}
              />
              {errors.guestName && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.guestName}</p>}
            </div>
          </div>

          {/* Guest Phone with fixed +91 prefix */}
          <div>
            <label htmlFor="guestPhone" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Phone / WhatsApp Number
            </label>
            <div className="mt-1.5 flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-3.5 text-sm font-semibold text-slate-600 select-none min-h-[44px]">
                +91
              </span>
              <input
                type="tel"
                id="guestPhone"
                name="guestPhone"
                value={formData.guestPhone}
                onChange={handlePhoneChange}
                placeholder="98765 43210"
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
                className={`block w-full rounded-r-lg border px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:outline-none focus:ring-2 min-h-[44px] ${
                  errors.guestPhone
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100"
                }`}
              />
            </div>
            {errors.guestPhone ? (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.guestPhone}</p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">Used for sending 1-click WhatsApp guest confirmation</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: STAY DETAILS */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Stay Details</h2>
              <p className="text-xs text-slate-500">Hotel property, dates, rooms, and guest headcount</p>
            </div>
          </div>
          {nights > 0 && (
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
              {nights} {nights === 1 ? "Night" : "Nights"} Stay
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Hotel Selector - Full width */}
          <div>
            <label htmlFor="hotelId" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Hotel Property <span className="text-rose-500">*</span>
            </label>
            <select
              id="hotelId"
              name="hotelId"
              value={formData.hotelId}
              onChange={handleInputChange}
              className={selectClass(!!errors.hotelId)}
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} — {h.location}
                </option>
              ))}
            </select>
            {errors.hotelId && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.hotelId}</p>}
          </div>

          {/* Dates: 2 columns on desktop, 1 on mobile */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="checkIn" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Check-In Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="checkIn"
                name="checkIn"
                value={formData.checkIn}
                onChange={handleInputChange}
                className={inputClass(!!errors.checkIn)}
              />
              {errors.checkIn && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.checkIn}</p>}
            </div>

            <div>
              <label htmlFor="checkOut" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Check-Out Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="checkOut"
                name="checkOut"
                value={formData.checkOut}
                onChange={handleInputChange}
                min={formData.checkIn}
                className={inputClass(!!errors.checkOut)}
              />
              {errors.checkOut && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.checkOut}</p>}
            </div>
          </div>

          {/* Multiple Room Types Allocation with individual room pricing */}
          <RoomAllocationsInput
            value={formData.roomAllocations || [{ roomType: formData.roomType, count: formData.rooms }]}
            onChange={handleRoomAllocationsChange}
            roomPricing={formData.roomPricing}
            onPricingChange={handlePricingChange}
            nights={nights}
            error={errors.rooms}
          />

          {/* Meal Options — Hotel Shree Kesari Nandan ONLY */}
          {isMealHotel && (
            <div className="pt-2">
              <MealSelectionsInput
                value={formData.mealSelections || []}
                onChange={handleMealSelectionsChange}
                nights={nights}
                adults={formData.adults}
              />
            </div>
          )}

          {/* Adults and Children: 2 columns */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="adults" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Adults (Age 12+) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                id="adults"
                name="adults"
                min="1"
                value={formData.adults}
                onChange={handleInputChange}
                className={inputClass(!!errors.adults)}
              />
              {errors.adults && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.adults}</p>}
            </div>

            <div>
              <label htmlFor="children" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Children (Under 12)
              </label>
              <input
                type="number"
                id="children"
                name="children"
                min="0"
                value={formData.children}
                onChange={handleInputChange}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: PAYMENT */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Payment</h2>
              <p className="text-xs text-slate-500">Amounts, advance received, balance calculation, and status</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Balance Due:</span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                balanceDue > 0 ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
              }`}
            >
              ₹{balanceDue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Automatic Calculation Summary Banner if pricing entered */}
          {(totalRoomCharges > 0 || totalMealCharges > 0) && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                {totalRoomCharges > 0 && (
                  <span className="text-slate-700">
                    Room Charges: <strong className="font-bold text-slate-900">₹{totalRoomCharges.toLocaleString("en-IN")}</strong>
                  </span>
                )}
                {totalMealCharges > 0 && (
                  <span className="text-slate-700">
                    Meal Charges: <strong className="font-bold text-amber-800">₹{totalMealCharges.toLocaleString("en-IN")}</strong>
                  </span>
                )}
                {extraCharges > 0 && (
                  <span className="text-slate-700">
                    Extra Charges: <strong className="font-bold text-slate-900">₹{extraCharges.toLocaleString("en-IN")}</strong>
                  </span>
                )}
              </div>
              <span className="font-bold text-xs text-indigo-700 bg-white px-2.5 py-1 rounded-md border border-indigo-200">
                Auto Total: ₹{(totalRoomCharges + totalMealCharges + extraCharges).toLocaleString("en-IN")}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Total Amount */}
            <div>
              <label htmlFor="totalAmount" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Total Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">₹</span>
                <input
                  type="number"
                  id="totalAmount"
                  name="totalAmount"
                  min="0"
                  step="any"
                  value={formData.totalAmount || ""}
                  onChange={handleInputChange}
                  placeholder="0"
                  className={`block w-full rounded-lg border pl-8 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-2xs focus:outline-none focus:ring-2 min-h-[44px] ${
                    errors.totalAmount
                      ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200"
                      : "border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                />
              </div>
              {errors.totalAmount && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.totalAmount}</p>}
            </div>

            {/* Additional / Extra Charges */}
            <div>
              <label htmlFor="extraCharges" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Extra Charges (₹)
              </label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">₹</span>
                <input
                  type="number"
                  id="extraCharges"
                  min="0"
                  step="any"
                  value={extraCharges || ""}
                  onChange={handleExtraChargesChange}
                  placeholder="0"
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]"
                />
              </div>
            </div>

            {/* Advance Amount */}
            <div>
              <label htmlFor="advanceAmount" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Advance Paid (₹)
              </label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">₹</span>
                <input
                  type="number"
                  id="advanceAmount"
                  name="advanceAmount"
                  min="0"
                  step="any"
                  value={formData.advanceAmount || ""}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]"
                />
              </div>
            </div>

            {/* Balance Due */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Calculated Balance (₹)
              </label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">₹</span>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={balanceDue}
                  aria-label="Calculated balance due"
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3.5 py-2.5 text-sm font-bold text-slate-700 shadow-2xs min-h-[44px]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Payment Status Dropdown */}
            <div>
              <label htmlFor="paymentStatus" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Payment Status
              </label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleInputChange}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]"
              >
                <option value={PaymentStatus.PENDING}>Pending</option>
                <option value={PaymentStatus.ADVANCE_PAYMENT_DUE}>Advance Payment Due</option>
                <option value={PaymentStatus.ADVANCE_PAID}>Advance Paid</option>
                <option value={PaymentStatus.FULLY_PAID}>Fully Paid</option>
                <option value={PaymentStatus.REFUNDED}>Refunded</option>
              </select>
            </div>

            {/* GST (Optional) */}
            <div>
              <label htmlFor="gstAmount" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                GST / Tax Amount (₹) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">₹</span>
                <input
                  type="number"
                  id="gstAmount"
                  name="gstAmount"
                  min="0"
                  step="any"
                  value={formData.gstAmount || ""}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: ADDITIONAL INFORMATION */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
            4
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Additional Information</h2>
            <p className="text-xs text-slate-500">Booking reference ID, booking channel, and guest special requests</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Booking ID (Display/Readonly in edit) */}
            <div>
              <label htmlFor="bookingId" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Booking ID
              </label>
              <input
                type="text"
                id="bookingId"
                name="bookingId"
                readOnly
                disabled
                value={formData.bookingId}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-600 shadow-2xs min-h-[44px]"
              />
            </div>

            {/* Booking Source */}
            <div>
              <label htmlFor="bookingSource" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Booking Source
              </label>
              <select
                id="bookingSource"
                name="bookingSource"
                value={formData.bookingSource}
                onChange={handleInputChange}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]"
              >
                <option value={BookingSource.PHONE}>Phone</option>
                <option value={BookingSource.WHATSAPP}>WhatsApp</option>
                <option value={BookingSource.WEBSITE}>Website</option>
                <option value={BookingSource.OFFLINE}>Offline</option>
                <option value={BookingSource.TRAVEL_AGENT}>Travel Agent</option>
                <option value={BookingSource.OTHER}>Other</option>
              </select>
            </div>

            {/* Include in Excel */}
            <div>
              <label htmlFor="includeInExcel" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Include in Excel
              </label>
              <select
                id="includeInExcel"
                name="includeInExcel"
                value={formData.includeInExcel ? "yes" : "no"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    includeInExcel: e.target.value === "yes",
                  }))
                }
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 min-h-[44px]"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          {/* Travel Agent conditional fields */}
          {formData.bookingSource === BookingSource.TRAVEL_AGENT && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-4 rounded-lg border border-indigo-100 bg-indigo-50/30">
              <div>
                <label htmlFor="travelAgentSelect" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Select Travel Agent
                </label>
                <select
                  id="travelAgentSelect"
                  value={selectedTravelAgent}
                  onChange={handleTravelAgentSelect}
                  className={selectClass(false)}
                >
                  {TRAVEL_AGENTS.map((agent) => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>
              </div>

              {selectedTravelAgent === "Other" && (
                <div>
                  <label htmlFor="travelAgentManual" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Travel Agent Name
                  </label>
                  <input
                    type="text"
                    id="travelAgentManual"
                    value={manualTravelAgent}
                    onChange={handleManualAgentChange}
                    placeholder="Enter travel agent name"
                    className={inputClass(false)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Special Notes / Requests (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes || ""}
              onChange={handleInputChange}
              placeholder="e.g. Early check-in requested, ground floor preferred..."
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Link
          href={`/bookings/${id}`}
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors min-h-[44px]"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 active:bg-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>

    {/* Calculator on mobile: below booking form */}
    <div className="mt-8 block lg:hidden pb-12">
      <BookingCalculator />
    </div>
  </div>

  {/* Calculator on desktop: sticky right panel */}
  <div className="hidden lg:block lg:col-span-4 sticky top-6">
    <BookingCalculator />
  </div>
</div>
);
}

"use client";

import { useMemo } from "react";
import { MealSelection, MealType } from "@/types/booking";
import { MEAL_TYPE_OPTIONS } from "@/config/booking-options";
import { UtensilsCrossed, Plus, Minus, Check } from "lucide-react";

interface MealSelectionsInputProps {
  value: MealSelection[];
  onChange: (meals: MealSelection[]) => void;
  nights: number;
  adults: number;
}

export default function MealSelectionsInput({
  value,
  onChange,
  nights,
  adults,
}: MealSelectionsInputProps) {
  const currentMeals = useMemo(() => {
    if (Array.isArray(value)) return value;
    return [];
  }, [value]);

  const totalMealCharges = currentMeals.reduce((sum, m) => sum + (m.subtotal || 0), 0);

  const toggleMeal = (mealType: MealType) => {
    const exists = currentMeals.find((m) => m.mealType === mealType);
    if (exists) {
      onChange(currentMeals.filter((m) => m.mealType !== mealType));
    } else {
      const newMeal: MealSelection = {
        mealType,
        pricePerPerson: 0,
        numberOfPeople: adults || 1,
        numberOfDays: nights || 1,
        subtotal: 0,
      };
      onChange([...currentMeals, newMeal]);
    }
  };

  const updateMealField = (
    mealType: MealType,
    field: "pricePerPerson" | "numberOfPeople" | "numberOfDays",
    rawValue: number
  ) => {
    const val = Math.max(field === "pricePerPerson" ? 0 : 1, rawValue);
    onChange(
      currentMeals.map((m) => {
        if (m.mealType !== mealType) return m;
        const updated = { ...m, [field]: val };
        updated.subtotal = updated.pricePerPerson * updated.numberOfPeople * updated.numberOfDays;
        return updated;
      })
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          <span className="flex items-center gap-1.5">
            <UtensilsCrossed className="h-3.5 w-3.5 text-amber-600" />
            Meal Options
          </span>
        </label>
        {totalMealCharges > 0 && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Meals: ₹{totalMealCharges.toLocaleString("en-IN")}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Select meals and enter the price per person. Only available for Hotel Shree Kesari Nandan.
      </p>

      {/* Meal Type Toggle Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {MEAL_TYPE_OPTIONS.map((mealType) => {
          const meal = currentMeals.find((m) => m.mealType === mealType);
          const isSelected = !!meal;

          return (
            <div
              key={mealType}
              className={`rounded-xl border transition-all ${
                isSelected
                  ? "border-amber-400 bg-amber-50/40 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {/* Toggle button */}
              <button
                type="button"
                onClick={() => toggleMeal(mealType as MealType)}
                className="flex items-center gap-2.5 text-left w-full p-3 select-none"
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-white transition-colors ${
                    isSelected
                      ? "border-amber-600 bg-amber-600"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-slate-500" />
                  <span>{mealType}</span>
                </div>
              </button>

              {/* Meal detail inputs when selected */}
              {isSelected && meal && (
                <div className="px-3 pb-3 space-y-2 border-t border-amber-200/60 pt-2.5">
                  {/* Price per person */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Price / Person (₹)
                    </label>
                    <div className="relative mt-0.5">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={meal.pricePerPerson || ""}
                        onChange={(e) =>
                          updateMealField(
                            mealType as MealType,
                            "pricePerPerson",
                            Number(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        className="block w-full rounded-md border border-slate-300 bg-white pl-6 pr-2 py-1.5 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                      />
                    </div>
                  </div>

                  {/* Number of people */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      People
                    </label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateMealField(
                            mealType as MealType,
                            "numberOfPeople",
                            (meal.numberOfPeople || 1) - 1
                          )
                        }
                        disabled={(meal.numberOfPeople || 1) <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={meal.numberOfPeople || 1}
                        onChange={(e) =>
                          updateMealField(
                            mealType as MealType,
                            "numberOfPeople",
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-12 text-center rounded border border-slate-300 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateMealField(
                            mealType as MealType,
                            "numberOfPeople",
                            (meal.numberOfPeople || 1) + 1
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Number of days/meals */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Days / Meals
                    </label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateMealField(
                            mealType as MealType,
                            "numberOfDays",
                            (meal.numberOfDays || 1) - 1
                          )
                        }
                        disabled={(meal.numberOfDays || 1) <= 1}
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={meal.numberOfDays || 1}
                        onChange={(e) =>
                          updateMealField(
                            mealType as MealType,
                            "numberOfDays",
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-12 text-center rounded border border-slate-300 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateMealField(
                            mealType as MealType,
                            "numberOfDays",
                            (meal.numberOfDays || 1) + 1
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  {meal.subtotal > 0 && (
                    <div className="text-right pt-1 border-t border-amber-100">
                      <span className="text-[10px] text-slate-500">Subtotal: </span>
                      <span className="text-xs font-bold text-amber-800">
                        ₹{meal.subtotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

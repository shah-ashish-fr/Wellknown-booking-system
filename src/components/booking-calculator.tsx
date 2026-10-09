"use client";

import { useState } from "react";
import { Calculator, Delete, RotateCcw } from "lucide-react";

export default function BookingCalculator() {
  const [display, setDisplay] = useState<string>("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [history, setHistory] = useState<string>("");

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clearAll = () => {
    setDisplay("0");
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHistory("");
  };

  const clearEntry = () => {
    setDisplay("0");
  };

  const backspace = () => {
    if (waitingForOperand) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const calculate = (a: number, b: number, op: string): number => {
    let result = 0;
    switch (op) {
      case "+":
        result = a + b;
        break;
      case "-":
        result = a - b;
        break;
      case "×":
        result = a * b;
        break;
      case "÷":
        result = b !== 0 ? a / b : 0;
        break;
      default:
        return b;
    }
    // Round to avoid IEEE-754 precision artifacts e.g. 0.30000000000000004
    return Math.round(result * 1000000) / 1000000;
  };

  const performOperation = (nextOp: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
      setHistory(`${inputValue} ${nextOp}`);
    } else if (operation) {
      const result = calculate(prevValue, inputValue, operation);
      setPrevValue(result);
      setDisplay(String(result));
      setHistory(`${result} ${nextOp}`);
    }

    setWaitingForOperand(true);
    setOperation(nextOp);
  };

  const handleEquals = () => {
    if (operation === null || prevValue === null) return;

    const inputValue = parseFloat(display);
    const result = calculate(prevValue, inputValue, operation);

    setHistory(`${prevValue} ${operation} ${inputValue} =`);
    setDisplay(String(result));
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2 text-slate-800">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Quick Calculator
            </h3>
            <p className="text-[10px] text-slate-400">Convenience math helper</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearAll}
          title="Reset Calculator"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Screen / Display */}
      <div className="rounded-xl bg-slate-900 p-3 text-right text-white shadow-inner mb-3">
        <div className="h-4 text-[11px] font-mono text-slate-400 truncate">
          {history || "\u00A0"}
        </div>
        <div className="mt-0.5 text-2xl font-bold font-mono tracking-tight text-white overflow-x-auto select-all">
          {display}
        </div>
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
        {/* Row 1 */}
        <button
          type="button"
          onClick={clearAll}
          className="h-10 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 active:scale-95 transition-all font-bold"
        >
          AC
        </button>
        <button
          type="button"
          onClick={clearEntry}
          className="h-10 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
        >
          C
        </button>
        <button
          type="button"
          onClick={backspace}
          className="h-10 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
          title="Backspace"
        >
          <Delete className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => performOperation("÷")}
          className="h-10 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all text-sm font-bold"
        >
          ÷
        </button>

        {/* Row 2 */}
        <button
          type="button"
          onClick={() => inputDigit("7")}
          className="h-10 rounded-lg bg-slate-50 text-slate-800 border border-slate-200/60 hover:bg-slate-100 active:scale-95 transition-all"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => inputDigit("8")}
          className="h-10 rounded-lg bg-slate-50 text-slate-800 border border-slate-200/60 hover:bg-slate-100 active:scale-95 transition-all"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => inputDigit("9")}
          className="h-10 rounded-lg bg-slate-50 text-slate-800 border border-slate-200/60 hover:bg-slate-100 active:scale-95 transition-all"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => performOperation("×")}
          className="h-10 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all text-sm font-bold"
        >
          ×
        </button>

        {/* Row 3 */}
        <button
          type="button"
          onClick={() => inputDigit("4")}
          className="h-10 rounded-lg bg-slate-50 text-slate-800 border border-slate-200/60 hover:bg-slate-100 active:scale-95 transition-all"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => inputDigit("5")}
          className="h-10 rounded-lg bg-slate-50 text-slate-800 border border-slate-200/60 hover:bg-slate-100 active:scale-95 transition-all"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => inputDigit("6")}
          className="h-10 rounded-lg bg-slate-50 text-slate-800 border border-slate-200/60 hover:bg-slate-100 active:scale-95 transition-all"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => performOperation("-")}
          className="h-10 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all text-sm font-bold"
        >
          −
        </button>

        {/* Row 4 */}
        <button
          type="button"
          onClick={() => inputDigit("1")}
          className="h-10 rounded-lg bg-slate-50 text-slate-800 border border-slate-200/60 hover:bg-slate-100 active:scale-95 transition-all"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => inputDigit("2")}
          className="h-10 rounded-lg bg-slate-50 text-slate-800 border border-slate-200/60 hover:bg-slate-100 active:scale-95 transition-all"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => inputDigit("3")}
          className="h-10 rounded-lg bg-slate-50 text-slate-800 border border-slate-200/60 hover:bg-slate-100 active:scale-95 transition-all"
        >
          3
        </button>
        <button
          type="button"
          onClick={() => performOperation("+")}
          className="h-10 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all text-sm font-bold"
        >
          +
        </button>

        {/* Row 5 */}
        <button
          type="button"
          onClick={() => inputDigit("0")}
          className="col-span-2 h-10 rounded-lg bg-slate-50 text-slate-800 border border-slate-200/60 hover:bg-slate-100 active:scale-95 transition-all"
        >
          0
        </button>
        <button
          type="button"
          onClick={inputDecimal}
          className="h-10 rounded-lg bg-slate-50 text-slate-800 border border-slate-200/60 hover:bg-slate-100 active:scale-95 transition-all font-bold text-sm"
        >
          .
        </button>
        <button
          type="button"
          onClick={handleEquals}
          className="h-10 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-2xs transition-all font-bold text-sm"
        >
          =
        </button>
      </div>

      <p className="mt-2 text-center text-[10px] text-slate-400">
        Independent scratchpad • Does not alter booking values
      </p>
    </div>
  );
}

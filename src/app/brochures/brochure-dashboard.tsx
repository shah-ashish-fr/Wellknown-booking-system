"use client";

import { useState, useEffect } from "react";
import {
  DEFAULT_BROCHURES,
  HotelBrochureData,
  BrochureRoomType,
  BrochureMealOption,
} from "@/config/hotel-brochures";
import HotelBrochureView from "@/components/hotel-brochure-view";
import {
  Building2,
  Printer,
  Share2,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  X,
  FileDown,
  Sparkles,
  MapPin,
  UtensilsCrossed,
  Info,
} from "lucide-react";

export default function BrochureDashboard() {
  const [selectedKey, setSelectedKey] = useState<"shivansh" | "kesari" | "manas">("kesari");
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Store edited brochures per hotel key
  const [brochures, setBrochures] = useState<Record<string, HotelBrochureData>>(DEFAULT_BROCHURES);

  // Load saved customizations from localStorage on client mount
  useEffect(() => {
    try {
      const saved: Record<string, HotelBrochureData> = { ...DEFAULT_BROCHURES };
      for (const key of ["shivansh", "kesari", "manas"]) {
        const item = localStorage.getItem(`wk_brochure_${key}`);
        if (item) {
          saved[key] = JSON.parse(item);
        }
      }
      setBrochures(saved);
    } catch (e) {
      console.warn("Could not load saved brochures from localStorage:", e);
    }
  }, []);

  const currentBrochure = brochures[selectedKey] || DEFAULT_BROCHURES[selectedKey];

  // Save current hotel brochure update
  const updateCurrentBrochure = (updater: (prev: HotelBrochureData) => HotelBrochureData) => {
    setBrochures((prev) => {
      const updated = updater(prev[selectedKey] || DEFAULT_BROCHURES[selectedKey]);
      try {
        localStorage.setItem(`wk_brochure_${selectedKey}`, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save brochure to localStorage:", e);
      }
      return {
        ...prev,
        [selectedKey]: updated,
      };
    });
  };

  const handleResetDefaults = () => {
    if (confirm(`Reset ${currentBrochure.name} brochure back to default template?`)) {
      setBrochures((prev) => {
        try {
          localStorage.removeItem(`wk_brochure_${selectedKey}`);
        } catch {}
        return {
          ...prev,
          [selectedKey]: DEFAULT_BROCHURES[selectedKey],
        };
      });
    }
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  // WhatsApp formatted share message
  const generateShareMessage = () => {
    let msg = `🏨 *GUEST BROCHURE — ${currentBrochure.name.toUpperCase()}*\n`;
    msg += `*Managed by WellKnown Hospitality Services*\n\n`;
    msg += `Dear Guest,\n`;
    msg += `We are pleased to share the official hotel brochure for *${currentBrochure.name}*.\n\n`;
    msg += `📍 *Location:* ${currentBrochure.location}\n`;
    if (currentBrochure.mapsUrl) {
      msg += `🗺️ *Google Maps:* ${currentBrochure.mapsUrl}\n`;
    }
    msg += `📞 *Reservations / Front Desk:* ${currentBrochure.phone}\n`;
    if (currentBrochure.reception) {
      msg += `📞 *Reception Desk:* ${currentBrochure.reception}\n`;
    }
    msg += `\n✨ *Key Highlights & Amenities:*\n`;
    for (const a of currentBrochure.amenities.slice(0, 5)) {
      msg += `• ${a}\n`;
    }
    if (currentBrochure.mealsEnabled && currentBrochure.meals && currentBrochure.meals.length > 0) {
      msg += `\n🍽️ *Pure Vegetarian Dining Available:* Breakfast, Lunch & Dinner\n`;
    }
    msg += `\n_Please find attached the official PDF brochure with full room categories, photographs, and property details. For reservations, please reply to this message!_ ✨`;
    return msg;
  };

  const handleCopyShareText = async () => {
    try {
      await navigator.clipboard.writeText(generateShareMessage());
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {}
  };

  return (
    <div className="space-y-6 pb-16">
      {/* PRINT-ONLY CSS RULES (Injects cleanly to format A4 print) */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          nav,
          header,
          aside,
          .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          #brochure-printable-document {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* TOP HEADER & HOTEL SELECTOR (Hidden in Print) */}
      <div className="no-print space-y-4">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <Building2 className="h-6 w-6 text-indigo-600" />
              <span>Hotel Brochure Generator</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Generate, customize, download, and share guest-facing hotel brochures with WellKnown branding.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Editor */}
            <button
              type="button"
              onClick={() => setShowEditor(!showEditor)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border shadow-2xs transition-colors min-h-[40px] ${
                showEditor
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{showEditor ? "Hide Editor" : "Customize Content"}</span>
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 shadow-2xs min-h-[40px]"
              title="Reset brochure content back to original defaults"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors min-h-[40px]"
              title="Print or Save as high-quality PDF"
            >
              <FileDown className="h-4 w-4" />
              <span>Download PDF</span>
            </button>

            {/* Share via WhatsApp */}
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors min-h-[40px]"
              title="Download PDF and share with guest via WhatsApp"
            >
              <Share2 className="h-4 w-4" />
              <span>Share Brochure</span>
            </button>
          </div>
        </div>

        {/* HOTEL SELECTOR TABS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Hotel Shivansh */}
          <button
            type="button"
            onClick={() => setSelectedKey("shivansh")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedKey === "shivansh"
                ? "border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600"
                : "border-slate-200 bg-white hover:border-slate-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Hotel Shivansh</span>
              {selectedKey === "shivansh" && (
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400" />
              Nathdwara, Rajasthan
            </p>
          </button>

          {/* Hotel Shree Kesari Nandan */}
          <button
            type="button"
            onClick={() => setSelectedKey("kesari")}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              selectedKey === "kesari"
                ? "border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600"
                : "border-slate-200 bg-white hover:border-slate-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Hotel Shree Kesari Nandan</span>
              {selectedKey === "kesari" && (
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
              )}
            </div>
            <div className="flex items-center justify-between gap-1 mt-0.5">
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                Dwarka, Gujarat
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                <UtensilsCrossed className="h-2.5 w-2.5" />
                Meals
              </span>
            </div>
          </button>

          {/* Manas Homestay */}
          <button
            type="button"
            onClick={() => setSelectedKey("manas")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedKey === "manas"
                ? "border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600"
                : "border-slate-200 bg-white hover:border-slate-300 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Manas Homestay</span>
              {selectedKey === "manas" && (
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400" />
              Saputara, Gujarat
            </p>
          </button>
        </div>
      </div>

      {/* OPTIONAL CUSTOMIZATION ACCORDION (Hidden in Print) */}
      {showEditor && (
        <div className="no-print rounded-xl border border-indigo-200 bg-indigo-50/30 p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
                <span>Customize Brochure Content — {currentBrochure.name}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All edits update the live preview in real time and persist automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowEditor(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Done Editing
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Tagline */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Tagline / Subheading
              </label>
              <input
                type="text"
                value={currentBrochure.tagline}
                onChange={(e) =>
                  updateCurrentBrochure((prev) => ({ ...prev, tagline: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
            </div>

            {/* Cover Image URL */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Cover Photo URL
              </label>
              <input
                type="text"
                value={currentBrochure.coverImage}
                onChange={(e) =>
                  updateCurrentBrochure((prev) => ({ ...prev, coverImage: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Short Hotel Description
              </label>
              <textarea
                rows={3}
                value={currentBrochure.description}
                onChange={(e) =>
                  updateCurrentBrochure((prev) => ({ ...prev, description: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Contact Phone / WhatsApp
              </label>
              <input
                type="text"
                value={currentBrochure.phone}
                onChange={(e) =>
                  updateCurrentBrochure((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
            </div>

            {/* Reception */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Reception Desk Contact (Optional)
              </label>
              <input
                type="text"
                value={currentBrochure.reception || ""}
                onChange={(e) =>
                  updateCurrentBrochure((prev) => ({ ...prev, reception: e.target.value || undefined }))
                }
                placeholder="e.g. +91 95741 30505"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
            </div>

            {/* Emergency Owner Contact */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Emergency Contact (Optional)
              </label>
              <input
                type="text"
                value={currentBrochure.emergencyOwner || ""}
                onChange={(e) =>
                  updateCurrentBrochure((prev) => ({ ...prev, emergencyOwner: e.target.value || undefined }))
                }
                placeholder="e.g. +91 873303182"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
            </div>

            {/* Google Maps Link */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Google Maps URL
              </label>
              <input
                type="text"
                value={currentBrochure.mapsUrl}
                onChange={(e) =>
                  updateCurrentBrochure((prev) => ({ ...prev, mapsUrl: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* BROCHURE PREVIEW WRAPPER */}
      <div className="space-y-3">
        <div className="no-print flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Live Preview (High-Resolution Guest Brochure)
          </span>
          <span>Tip: Click "Download PDF" to save or print</span>
        </div>

        {/* Live Brochure Document */}
        <HotelBrochureView data={currentBrochure} />
      </div>

      {/* SHARE MODAL (Hidden in Print) */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in no-print">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Share Hotel Brochure
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {currentBrochure.name} — {currentBrochure.location}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sharing Steps Guidance */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 space-y-2 text-xs text-emerald-950">
              <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                <Info className="h-4 w-4 text-emerald-600" />
                How to share via WhatsApp:
              </span>
              <ol className="list-decimal pl-4 space-y-1 text-slate-700 text-[11px]">
                <li>Click <strong>"Step 1: Download PDF"</strong> below to save the brochure document.</li>
                <li>Click <strong>"Step 2: Copy Message"</strong> or <strong>"Open WhatsApp"</strong>.</li>
                <li>In WhatsApp, attach the saved PDF file to your message and send!</li>
              </ol>
            </div>

            {/* Message Preview */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Formatted Guest Message
              </label>
              <textarea
                readOnly
                rows={6}
                value={generateShareMessage()}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 font-mono select-all focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <FileDown className="h-4 w-4 text-slate-600" />
                <span>Step 1: Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handleCopyShareText}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                {copiedText ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700">Message Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-600" />
                    <span>Step 2: Copy Message</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(generateShareMessage())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  MessageSquare,
  Building2,
  Copy,
  Check,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import {
  BookingTemplateData,
  generateGuestConfirmation,
  generateHotelConfirmation,
  getHotelWhatsAppRecipient,
} from "@/lib/whatsapp-templates";

interface WhatsAppMessageGeneratorProps {
  booking: BookingTemplateData;
  className?: string;
}

type MessageType = "guest" | "hotel";

export default function WhatsAppMessageGenerator({
  booking,
  className = "",
}: WhatsAppMessageGeneratorProps) {
  const [activeModal, setActiveModal] = useState<MessageType | null>(null);
  const [copied, setCopied] = useState(false);

  const guestMessage = generateGuestConfirmation(booking);
  const hotelMessage = generateHotelConfirmation(booking);

  const currentMessage = activeModal === "guest" ? guestMessage : hotelMessage;

  // Resolve hotel-specific WhatsApp recipient number:
  // Hotel Shivansh / Manas Homestay -> +91 88660 07770
  // Hotel Shree Kesari Nandan -> +91 95741 30505
  const hotelRecipient = getHotelWhatsAppRecipient(booking.hotel?.name, booking.hotel?.location);
  const hotelWhatsappUrl = `https://wa.me/${hotelRecipient.waNumber}?text=${encodeURIComponent(hotelMessage)}`;

  // Clean guest phone number for WhatsApp URL (international format +91)
  const cleanGuestDigits = (booking.guestPhone || "").replace(/[^0-9]/g, "");
  const cleanGuestPhone =
    cleanGuestDigits.length === 10 ? `91${cleanGuestDigits}` : cleanGuestDigits;

  const guestWhatsappUrl = cleanGuestPhone
    ? `https://wa.me/${cleanGuestPhone}?text=${encodeURIComponent(guestMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(guestMessage)}`;

  const currentWhatsappUrl = activeModal === "guest" ? guestWhatsappUrl : hotelWhatsappUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  return (
    <>
      {/* PROMINENT ACTION BUTTONS */}
      <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
        {/* WhatsApp Guest */}
        <button
          type="button"
          onClick={() => {
            setActiveModal("guest");
            setCopied(false);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 active:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 min-h-[42px]"
          title="Preview and send formatted confirmation to Guest via WhatsApp"
        >
          <MessageSquare className="h-4 w-4" />
          <span>WhatsApp Guest</span>
        </button>

        {/* WhatsApp Hotel */}
        <a
          href={hotelWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 min-h-[42px]"
          title={`Open WhatsApp to send Hotel Confirmation to ${booking.hotel?.name || "Hotel"} Desk (${hotelRecipient.displayPhone})`}
        >
          <Building2 className="h-4 w-4 text-slate-500" />
          <span>WhatsApp Hotel</span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
        </a>
      </div>

      {/* READABLE PREVIEW MODAL */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 sm:px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    WhatsApp Message Preview
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Formatted text ready to preview and send
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                aria-label="Close message preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Template Type Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 sm:px-6 pt-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal("guest");
                  setCopied(false);
                }}
                className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-2.5 text-xs font-semibold transition-all ${
                  activeModal === "guest"
                    ? "border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Guest Confirmation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModal("hotel");
                  setCopied(false);
                }}
                className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-2.5 text-xs font-semibold transition-all ${
                  activeModal === "hotel"
                    ? "border-indigo-600 text-indigo-800 bg-white rounded-t-lg shadow-2xs"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Hotel Confirmation</span>
              </button>
            </div>

            {/* Modal Body: Message Preview */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Formatted Text Preview:
                </span>
                <span className="text-slate-500 text-[11px] font-mono">
                  {activeModal === "guest"
                    ? `To: ${booking.guestName} (${cleanGuestPhone ? `+${cleanGuestPhone}` : "No number"})`
                    : `To: ${booking.hotel?.name || "Hotel"} (${hotelRecipient.displayPhone})`}
                </span>
              </div>

              {/* Chat-bubble message display */}
              <div className="relative rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 sm:p-5 shadow-2xs overflow-x-auto">
                <pre className="font-sans text-xs sm:text-sm text-slate-900 whitespace-pre-wrap leading-relaxed select-all">
                  {currentMessage}
                </pre>
              </div>

              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                Formatting tags (<span className="font-mono font-bold">*bold*</span> and <span className="font-mono italic">_italic_</span>) will render natively in WhatsApp.
              </p>
            </div>

            {/* Modal Footer with Copy Button & WhatsApp Direct */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/90 px-4 sm:px-6 py-3.5">
              <div className="text-xs text-slate-600 w-full sm:w-auto text-center sm:text-left">
                {copied ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied to clipboard! Ready to paste into WhatsApp.
                  </span>
                ) : (
                  <span>Click Copy or open directly in WhatsApp.</span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 sm:flex-initial rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors min-h-[40px]"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-all min-h-[40px] ${
                    copied
                      ? "bg-emerald-700 text-white"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <a
                  href={currentWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors min-h-[40px]"
                  title="Open in WhatsApp with pre-filled message"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Open App</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

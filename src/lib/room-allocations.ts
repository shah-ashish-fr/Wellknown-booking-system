import { RoomAllocation } from "@/types/booking";
import { ROOM_TYPE_OPTIONS } from "@/config/booking-options";

/**
 * Safely parse room allocations from JSON or fallback strings.
 */
export function parseRoomAllocations(
  raw: unknown,
  fallbackRoomType?: string | null,
  fallbackRooms?: number | null
): RoomAllocation[] {
  // 1. If already an array of allocations
  if (Array.isArray(raw) && raw.length > 0) {
    const parsed = raw
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const type = (item as any).roomType || (item as any).type;
        const count = Math.max(1, parseInt(String((item as any).count || (item as any).rooms || 1), 10) || 1);
        if (!type || typeof type !== "string") return null;
        return { roomType: type.trim(), count };
      })
      .filter((item): item is RoomAllocation => item !== null);

    if (parsed.length > 0) {
      return parsed;
    }
  }

  // 2. If JSON string
  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try {
      const json = JSON.parse(raw);
      return parseRoomAllocations(json, fallbackRoomType, fallbackRooms);
    } catch {
      // Fall through to string pattern matching
    }
  }

  // 3. If string matches "2 × 2 Bed AC, 1 × 3 Bed AC" or "2 x 2 Bed AC"
  const textToScan = typeof raw === "string" && raw.trim() ? raw.trim() : (fallbackRoomType || "").trim();
  if (textToScan && (textToScan.includes("×") || textToScan.includes("x") || textToScan.includes("*"))) {
    const parts = textToScan.split(/[,\n•]+/).map((p) => p.trim()).filter(Boolean);
    const parsed: RoomAllocation[] = [];
    for (const part of parts) {
      const match = part.match(/^(\d+)\s*[×x*]\s*(.+)$/i);
      if (match) {
        const count = Math.max(1, parseInt(match[1], 10) || 1);
        const roomType = match[2].trim();
        if (roomType) {
          parsed.push({ roomType, count });
        }
      }
    }
    if (parsed.length > 0) {
      return parsed;
    }
  }

  // 4. Fallback to single room type
  const singleType = (fallbackRoomType || "").trim() || (typeof raw === "string" && raw.trim() ? raw.trim() : ROOM_TYPE_OPTIONS[0]);
  const singleRooms = Math.max(1, fallbackRooms || 1);
  return [{ roomType: singleType, count: singleRooms }];
}

/**
 * Format room allocations into a concise comma-separated string (e.g. for Excel, list views):
 * "2 × 2 Bed AC, 1 × 3 Bed AC"
 */
export function formatRoomAllocationsSummary(allocations: RoomAllocation[]): string {
  if (!allocations || allocations.length === 0) return ROOM_TYPE_OPTIONS[0];
  return allocations.map((a) => `${a.count} × ${a.roomType}`).join(", ");
}

/**
 * Format room allocations into bullet points (e.g. for WhatsApp, booking details):
 * • 2 × 2 Bed AC
 * • 1 × 3 Bed AC
 */
export function formatRoomAllocationsBulleted(allocations: RoomAllocation[]): string {
  if (!allocations || allocations.length === 0) return `• 1 × ${ROOM_TYPE_OPTIONS[0]}`;
  return allocations.map((a) => `• ${a.count} × ${a.roomType}`).join("\n");
}

/**
 * Calculate total room count across all allocations
 */
export function getTotalRoomCount(allocations: RoomAllocation[]): number {
  if (!allocations || allocations.length === 0) return 1;
  return allocations.reduce((sum, a) => sum + (Math.max(1, a.count || 1)), 0);
}

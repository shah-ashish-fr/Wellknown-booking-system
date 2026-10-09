/**
 * Configuration for Booking Form Options.
 * Centralized so that adding new travel agents or modifying title/room options
 * can be done in one single place without touching form component code.
 */

/**
 * Title options for guest selection
 */
export const GUEST_TITLE_OPTIONS = ["Mr.", "Mrs.", "Ms.", "Dr.", "Travel Agent"] as const;
export type GuestTitle = (typeof GUEST_TITLE_OPTIONS)[number];

/**
 * Fixed available room types for all properties
 */
export const ROOM_TYPE_OPTIONS = [
  "2 Bed AC",
  "2 Bed Non AC",
  "3 Bed AC",
  "4 Bed AC",
] as const;
export type RoomTypeOption = (typeof ROOM_TYPE_OPTIONS)[number];

/**
 * Travel Agent list.
 * To add more travel agents to the booking form dropdown,
 * simply append their names to this array before "Other".
 * Example:
 * export const TRAVEL_AGENTS: string[] = [
 *   "MakeMyTrip",
 *   "Goibibo",
 *   "Agoda",
 *   "Other",
 * ];
 */
export const TRAVEL_AGENTS: string[] = [
  "Other",
];

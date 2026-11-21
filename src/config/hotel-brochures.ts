import { HOTEL_CONTACT_DIRECTORY } from "@/lib/whatsapp-templates";

export interface BrochureRoomType {
  name: string;
  bedType: string;
  occupancy: string;
  description: string;
  image?: string;
  amenities: string[];
}

export interface BrochureMealOption {
  mealType: "Breakfast" | "Lunch" | "Dinner";
  description: string;
  timing?: string;
  pricingNote?: string;
}

export interface HotelBrochureData {
  id: string;
  hotelKey: "shivansh" | "kesari" | "manas";
  name: string;
  tagline: string;
  location: string;
  fullAddress: string;
  coverImage: string;
  secondaryImage: string;
  roomImage: string;
  description: string;
  checkInTime: string;
  checkOutTime: string;
  roomTypes: BrochureRoomType[];
  amenities: string[];
  mealsEnabled: boolean;
  meals: BrochureMealOption[];
  phone: string;
  reception?: string;
  emergencyOwner?: string;
  mapsUrl: string;
  nearbyAttractions: string[];
  policies: string[];
}

export const DEFAULT_BROCHURES: Record<string, HotelBrochureData> = {
  shivansh: {
    id: "hotel-shivansh",
    hotelKey: "shivansh",
    name: "Hotel Shivansh",
    tagline: "Spiritual Comfort & Warm Hospitality in the Holy City of Shrinathji",
    location: "Nathdwara, Rajasthan",
    fullAddress: "Near Shrinathji Temple, Nathdwara, Rajasthan 313301",
    coverImage: "/images/hotels/shivansh.jpg",
    secondaryImage: "/images/hotels/shivansh.jpg",
    roomImage: "/images/hotels/room.jpg",
    description:
      "Hotel Shivansh welcomes pilgrims and travelers to Nathdwara with refined comfort, modern amenities, and dedicated service. Located in close proximity to the revered Shrinathji Temple, our property provides a peaceful sanctuary for families and devotees seeking a memorable spiritual retreat.",
    checkInTime: "12:00 PM",
    checkOutTime: "10:00 AM",
    roomTypes: [
      {
        name: "2 Bed AC",
        bedType: "1 Queen / Double Bed",
        occupancy: "2 Adults",
        description: "Comfortable air-conditioned room tailored for couples and individual travelers with plush bedding and modern bath fittings.",
        amenities: ["Air Conditioning", "Private Bathroom", "LED TV", "Free Wi-Fi", "24/7 Hot Water"],
      },
      {
        name: "2 Bed Non AC",
        bedType: "1 Queen / Double Bed",
        occupancy: "2 Adults",
        description: "Well-ventilated, budget-friendly room with premium bedding, ceiling fan, and modern attached bathroom.",
        amenities: ["Ceiling Fan", "Private Bathroom", "LED TV", "Free Wi-Fi", "24/7 Hot Water"],
      },
      {
        name: "4 Bed AC",
        bedType: "2 Queen / Double Beds",
        occupancy: "4 Adults",
        description: "Generously sized quad room ideal for larger families and pilgrimage groups traveling together.",
        amenities: ["Air Conditioning", "Private Bathroom", "LED TV", "Free Wi-Fi", "Daily Housekeeping"],
      },
    ],
    amenities: [
      "24×7 Hot & Cold Running Water",
      "High-Speed Wi-Fi Internet",
      "Flat Screen LED TV with Satellite Channels",
      "Power Backup & Inverter Support",
      "Daily Housekeeping & Fresh Linen",
      "Luggage Assistance & Travel Desk",
      "Lift / Elevator Facility",
      "Ample Secure Parking Space",
      "Proximity to Shrinathji Temple",
      "Pure Vegetarian Dining Assistance",
    ],
    mealsEnabled: false,
    meals: [],
    phone: HOTEL_CONTACT_DIRECTORY.shivansh.phone,
    reception: HOTEL_CONTACT_DIRECTORY.shivansh.reception,
    emergencyOwner: undefined,
    mapsUrl: HOTEL_CONTACT_DIRECTORY.shivansh.mapsUrl,
    nearbyAttractions: [
      "Shrinathji Temple (Walking distance / 5 mins)",
      "Statue of Belief — Vishwas Swaroopam (10 mins)",
      "Lal Bagh Gardens (7 mins)",
      "Giriraj Parikrama Point (15 mins)",
    ],
    policies: [
      "Valid Government Photo ID required for all adult guests at check-in.",
      "Strictly pure vegetarian property atmosphere.",
      "Early check-in & late check-out subject to room availability.",
    ],
  },

  kesari: {
    id: "cmupjnb390000c7m4l8141fqu",
    hotelKey: "kesari",
    name: "Hotel Shree Kesari Nandan",
    tagline: "Sacred Pilgrim Hospitality with Pure Veg Dining & Ocean Breeze",
    location: "Dwarka, Gujarat",
    fullAddress: "Near Dwarkadhish Temple & Beach, Dwarka, Gujarat 361335",
    coverImage: "/images/hotels/kesari.jpg",
    secondaryImage: "/images/hotels/kesari.jpg",
    roomImage: "/images/hotels/room.jpg",
    description:
      "Hotel Shree Kesari Nandan offers divine hospitality in the holy kingdom of Lord Krishna. Located conveniently in Dwarka near the sacred Dwarkadhish Temple and coastal promenade, we feature contemporary accommodations, pure vegetarian kitchen meals, and hospitable service for yatra groups and families.",
    checkInTime: "12:00 PM",
    checkOutTime: "10:00 AM",
    roomTypes: [
      {
        name: "2 Bed AC",
        bedType: "1 King / Queen Bed",
        occupancy: "2 Adults",
        description: "Cool, contemporary room with air conditioning, premium mattresses, and modern amenities for restful stay after darshan.",
        amenities: ["Air Conditioning", "Private Bathroom", "LED TV", "Free Wi-Fi", "24/7 Hot Water"],
      },
      {
        name: "3 Bed AC",
        bedType: "1 Double Bed + 1 Single Bed",
        occupancy: "3 Adults",
        description: "AC room with good ventilation and all essential travel comforts.",
        amenities: ["Air Conditioning", "Private Bathroom", "LED TV", "Free Wi-Fi", "Daily Cleaning"],
      },
      {
        name: "4 Bed AC",
        bedType: "2 Double Beds",
        occupancy: "4 Adults",
        description: "Expansive quadruple room suited for larger family pilgrimage groups seeking comfort and unity.",
        amenities: ["Air Conditioning", "Private Bathroom", "LED TV", "Free Wi-Fi", "Seating Area"],
      },
    ],
    amenities: [
      "Pure Vegetarian In-House Dining / Kitchen",
      "24×7 Hot & Cold Geyser Facility",
      "High-Speed Wi-Fi in All Rooms",
      "Lift / Elevator Service",
      "Round-the-Clock Power Backup",
      "Daily Housekeeping & Fresh Toiletries",
      "Darshan Guidance & Local Tour Assistance",
      "Spacious Vehicle Parking",
      "Mineral RO Drinking Water",
      "Luggage Storage on Request",
    ],
    mealsEnabled: true,
    meals: [
      {
        mealType: "Breakfast",
        timing: "07:30 AM – 10:30 AM",
        description: "Freshly prepared traditional vegetarian Gujarati & North Indian breakfast (Poha, Upma, Parathas, Tea/Coffee).",
        pricingNote: "INR 150 per person",
      },
      {
        mealType: "Lunch",
        timing: "11:30 PM – 02:30 PM",
        description: "Wholesome, hygienic Pure Veg Gujarati / North Indian Thali with Dal, Sabzi, Rotis, Rice & Sweet.",
        pricingNote: "INR 200 per person",
      },
      {
        mealType: "Dinner",
        timing: "07:30 PM – 10:30 PM",
        description: "Light and comforting hot evening dinner prepared fresh with seasonal vegetables and wholesome grains.",
        pricingNote: "INR 200 per person",
      },
    ],
    phone: HOTEL_CONTACT_DIRECTORY.kesari.phone,
    reception: HOTEL_CONTACT_DIRECTORY.kesari.reception,
    emergencyOwner: undefined,
    mapsUrl: HOTEL_CONTACT_DIRECTORY.kesari.mapsUrl,
    nearbyAttractions: [
      "Shree Dwarkadhish Temple (Jagat Mandir) — 5 mins",
      "Dwarka Beach & Lighthouse — 7 mins",
      "Bhadkeshwar Mahadev Temple — 8 mins",
      "Gomti Ghat & Sudama Setu — 6 mins",
      "Beyt Dwarka Ferry Point — 35 mins",
    ],
    policies: [
      "Valid Government Photo ID required for each guest.",
      "Strictly pure vegetarian food permitted on the premises.",
      "Check-in 12:00 PM | Check-out 10:00 AM.",
    ],
  },

  manas: {
    id: "manas-homestay",
    hotelKey: "manas",
    name: "Manas Homestay",
    tagline: "Home Like Environment in Saputara",
    location: "Saputara, Gujarat",
    fullAddress: "Hill Station Foothills, Saputara, Gujarat 394720",
    coverImage: "/images/hotels/manas.jpg",
    secondaryImage: "/images/hotels/manas.jpg",
    roomImage: "/images/hotels/room.jpg",
    description:
      "Manas Homestay is an idyllic mountain retreat nestled among the foggy hills of Saputara, Gujarat's only hill station. Surrounded by pristine greenery and cool breezes, our homestay offers a peaceful haven from urban bustle with cozy rustic-modern accommodations and attentive personalized hospitality.",
    checkInTime: "12:00 PM",
    checkOutTime: "10:00 AM",
    roomTypes: [
      {
        name: "2 Bed AC",
        bedType: "1 Queen / Double Bed",
        occupancy: "2 Adults",
        description: "",
        amenities: ["Air Conditioning", "Private Bath", "Wi-Fi", "Hot Water"],
      },
      {
        name: "2 Bed Non AC",
        bedType: "1 Double Bed",
        occupancy: "2 Adults",
        description: "Naturally cool room with large windows opening to lush garden and forested slopes.",
        amenities: ["Ceiling Fan", "Garden View", "Private Bath", "Hot Water", "Tea Setup"],
      },
      {
        name: "4 Bed AC",
        bedType: "2 Double Beds",
        occupancy: "4 Adults",
        description: "Spacious cottage-style family room ideal for leisure groups, nature lovers, and family holidays.",
        amenities: ["Air Conditioning", "Private Bath", "LED TV", "Free Wi-Fi", "Sitting Area"],
      },
    ],
    amenities: [
      "Hot Running Water",
      "Free High-Speed Wi-Fi",
      "Home Like Environment",
      "Power Inverter Backup",
      "Ample Safe Parking for Vehicles",
      "Peaceful & Quiet Natural Environment",
    ],
    mealsEnabled: false,
    meals: [],
    phone: HOTEL_CONTACT_DIRECTORY.manas.phone,
    reception: undefined,
    emergencyOwner: HOTEL_CONTACT_DIRECTORY.manas.emergencyOwner,
    mapsUrl: HOTEL_CONTACT_DIRECTORY.manas.mapsUrl,
    nearbyAttractions: [
      "Saputara Lake & Boating Point (5 mins)",
      "Sunset Point & Cable Car Ropeway (8 mins)",
      "Gira Waterfalls (40 mins)",
      "Step Garden & Rose Garden (7 mins)",
      "Hathgadh Fort (15 mins)",
    ],
    policies: [
      "Valid Government Photo ID required at check-in.",
      "Peaceful retreat policy — loud outdoor music prohibited after 10 PM.",
      "Family and couple friendly environment.",
    ],
  },
};

export function getBrochureByHotelKey(hotelKey: string): HotelBrochureData {
  if (hotelKey in DEFAULT_BROCHURES) {
    return DEFAULT_BROCHURES[hotelKey];
  }
  return DEFAULT_BROCHURES.kesari;
}

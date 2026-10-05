import { propertyStatus } from "../models/propertyModel.js";
import { userRoles } from "../models/userModel.js";

const STORAGE_KEYS = {
  properties: "estateledger.properties",
  enquiries: "estateledger.enquiries",
  users: "estateledger.users",
  activeUser: "estateledger.activeUser",
  buyerProfile: "estateledger.buyerProfile",
  comparison: "estateledger.comparison",
  searchAlerts: "estateledger.searchAlerts",
  aiChatHistory: "estateledger.aiChatHistory",
  recentlyViewed: "estateledger.recentlyViewed",
  dataVersion: "estateledger.dataVersion"
};

const starterProperties = [
  {
    id: "oakridge-sky-villa",
    title: "Oakridge Sky Villa",
    location: "Bengaluru",
    neighborhood: "Whitefield",
    price: 18500000,
    type: "Villa",
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 3120,
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    description: "A gated community villa with a double-height living room, private garden, EV-ready parking, and clubhouse access near the metro corridor.",
    agentName: "Nisha Rao",
    agentPhone: "+91 98765 44110",
    ownerEmail: "nisha@estateledger.test",
    status: propertyStatus.approved,
    verified: true,
    featured: true,
    postedAt: "2026-04-12T10:30:00.000Z",
    updatedAt: "2026-04-22T08:20:00.000Z",
    inspectionReady: true,
    score: 96
  },
  {
    id: "marina-courtyard-residence",
    title: "Marina Courtyard Residence",
    location: "Mumbai",
    neighborhood: "Bandra West",
    price: 32500000,
    type: "Apartment",
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 1840,
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    description: "Sea-link facing apartment with a wide balcony, concierge desk, two covered parking spaces, and verified society maintenance records.",
    agentName: "Arman Sheikh",
    agentPhone: "+91 98192 80808",
    ownerEmail: "arman@estateledger.test",
    status: propertyStatus.approved,
    verified: true,
    featured: true,
    postedAt: "2026-04-14T11:00:00.000Z",
    updatedAt: "2026-04-25T09:15:00.000Z",
    inspectionReady: true,
    score: 94
  },
  {
    id: "ecr-beach-house",
    title: "ECR Beach House",
    location: "Chennai",
    neighborhood: "Injambakkam",
    price: 21800000,
    type: "Independent House",
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 2760,
    imageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    description: "Independent home with a quiet study, terrace deck, staff room, and clean title paperwork already checked by the listing team.",
    agentName: "Meera Subramaniam",
    agentPhone: "+91 98404 77221",
    ownerEmail: "meera@estateledger.test",
    status: propertyStatus.approved,
    verified: true,
    featured: true,
    postedAt: "2026-04-10T14:00:00.000Z",
    updatedAt: "2026-04-21T12:45:00.000Z",
    inspectionReady: true,
    score: 91
  },
  {
    id: "cyber-heights-studio",
    title: "Cyber Heights Studio",
    location: "Hyderabad",
    neighborhood: "Gachibowli",
    price: 6800000,
    type: "Studio",
    bedrooms: 1,
    bathrooms: 1,
    areaSqft: 610,
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    description: "Compact studio for working professionals with managed security, co-working lounge, rental demand data, and a low-maintenance layout.",
    agentName: "Kavya Menon",
    agentPhone: "+91 90000 12981",
    ownerEmail: "kavya@estateledger.test",
    status: propertyStatus.approved,
    verified: true,
    featured: false,
    postedAt: "2026-04-16T09:10:00.000Z",
    updatedAt: "2026-04-20T16:30:00.000Z",
    inspectionReady: false,
    score: 86
  },
  {
    id: "greenfield-plot-42",
    title: "Greenfield Plot 42",
    location: "Pune",
    neighborhood: "Hinjewadi Phase 3",
    price: 9400000,
    type: "Plot",
    bedrooms: 0,
    bathrooms: 0,
    areaSqft: 2400,
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    description: "North-facing plotted development with road access, water connection, and zoning documents uploaded for buyer review.",
    agentName: "Rohit Patil",
    agentPhone: "+91 99220 31004",
    ownerEmail: "rohit@estateledger.test",
    status: propertyStatus.review,
    verified: false,
    featured: false,
    postedAt: "2026-04-24T17:20:00.000Z",
    updatedAt: "2026-04-24T17:20:00.000Z",
    inspectionReady: false,
    score: 78
  }
];

const advancedPropertyProfiles = {
  "oakridge-sky-villa": {
    imageUrl: "./assets/images/land2.jpg",
    visualTags: ["modern", "luxury", "gated"],
    lifestyleTags: ["quiet", "family", "commute"],
    amenities: ["EV parking", "Clubhouse", "Private garden", "Metro access"],
    noiseLevel: "Low",
    safetyScore: 92,
    walkabilityScore: 78,
    documentStatus: "Title deed, EC, and tax receipts reviewed",
    priceDroppedPercent: 3,
    expectedRent: 112000,
    priceHistory: [16800000, 17400000, 17900000, 18500000],
    coordinates: { lat: 12.9698, lng: 77.7500 }
  },
  "marina-courtyard-residence": {
    imageUrl: "./assets/images/land3.jpg",
    visualTags: ["luxury", "city", "modern"],
    lifestyleTags: ["city", "investment", "premium"],
    amenities: ["Concierge", "Sea-link view", "Covered parking", "Fitness deck"],
    noiseLevel: "Medium",
    safetyScore: 89,
    walkabilityScore: 91,
    documentStatus: "Society NOC and tax receipts reviewed",
    priceDroppedPercent: 0,
    expectedRent: 210000,
    priceHistory: [29400000, 30600000, 31700000, 32500000],
    coordinates: { lat: 19.0596, lng: 72.8295 }
  },
  "ecr-beach-house": {
    imageUrl: "./assets/images/land4.jpg",
    visualTags: ["minimal", "villa", "coastal"],
    lifestyleTags: ["quiet", "family", "weekend"],
    amenities: ["Terrace deck", "Staff room", "Private parking", "Study"],
    noiseLevel: "Low",
    safetyScore: 84,
    walkabilityScore: 66,
    documentStatus: "Title paperwork checked, coastal-zone review advised",
    priceDroppedPercent: 5,
    expectedRent: 128000,
    priceHistory: [20200000, 20800000, 22900000, 21800000],
    coordinates: { lat: 12.9182, lng: 80.2511 }
  },
  "cyber-heights-studio": {
    imageUrl: "./assets/images/land5.jpg",
    visualTags: ["minimal", "city", "compact"],
    lifestyleTags: ["city", "investment", "commute"],
    amenities: ["Co-working lounge", "Managed security", "Rental desk", "Gym"],
    noiseLevel: "Medium",
    safetyScore: 86,
    walkabilityScore: 83,
    documentStatus: "Builder handover packet reviewed",
    priceDroppedPercent: 2,
    expectedRent: 42000,
    priceHistory: [6100000, 6350000, 6600000, 6800000],
    coordinates: { lat: 17.4435, lng: 78.3772 }
  },
  "greenfield-plot-42": {
    imageUrl: "./assets/images/land6.jpg",
    status: propertyStatus.approved,
    verified: true,
    visualTags: ["plot", "eco", "investment"],
    lifestyleTags: ["quiet", "investment", "land"],
    amenities: ["Road access", "Water connection", "North-facing", "Gated layout"],
    noiseLevel: "Low",
    safetyScore: 80,
    walkabilityScore: 58,
    documentStatus: "Zoning and road-access review complete",
    priceDroppedPercent: 0,
    expectedRent: 0,
    priceHistory: [7600000, 8100000, 8750000, 9400000],
    coordinates: { lat: 18.5913, lng: 73.7389 }
  }
};

const starterUsers = [
  {
    id: "admin-1",
    name: "Portal Admin",
    email: "admin@estateledger.test",
    password: "admin123",
    role: userRoles.admin,
    savedPropertyIds: [],
    createdAt: "2026-04-01T07:00:00.000Z"
  }
];

export function seedInitialRecords() {
  const existingProperties = readCollection(STORAGE_KEYS.properties);
  const enrichedStarterProperties = starterProperties.map(enrichPropertyRecord);

  if (localStorage.getItem(STORAGE_KEYS.properties) === null) {
    writeCollection(STORAGE_KEYS.properties, enrichedStarterProperties);
  } else if (localStorage.getItem(STORAGE_KEYS.dataVersion) !== "house-images-3") {
    writeCollection(STORAGE_KEYS.properties, mergeAdvancedPropertyRecords(existingProperties, enrichedStarterProperties));
  }

  if (!readCollection(STORAGE_KEYS.users).length) {
    writeCollection(STORAGE_KEYS.users, starterUsers);
  }

  localStorage.setItem(STORAGE_KEYS.dataVersion, "house-images-3");
}

export function readCollection(storageKey) {
  try {
    const records = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.warn(`Unable to read ${storageKey}`, error);
    return [];
  }
}

export function writeCollection(storageKey, records) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
  } catch (error) {
    console.error(`Unable to save ${storageKey}`, error);
    throw new Error("Browser storage is full or blocked.");
  }
}

export function readActiveUserEmail() {
  return localStorage.getItem(STORAGE_KEYS.activeUser);
}

export function writeActiveUserEmail(email) {
  if (email) {
    localStorage.setItem(STORAGE_KEYS.activeUser, email);
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.activeUser);
}

function enrichPropertyRecord(propertyListing) {
  const advancedProfile = advancedPropertyProfiles[propertyListing.id] || {};
  return {
    visualTags: ["modern"],
    lifestyleTags: ["balanced"],
    amenities: [],
    noiseLevel: "Medium",
    safetyScore: 74,
    walkabilityScore: 70,
    priceDroppedPercent: 0,
    expectedRent: propertyListing.type === "Plot" ? 0 : Math.round(propertyListing.price * 0.0038),
    priceHistory: [propertyListing.price],
    coordinates: null,
    documentStatus: propertyListing.documentStatus || "Documents pending review",
    ...propertyListing,
    ...advancedProfile
  };
}

function mergeAdvancedPropertyRecords(existingProperties, enrichedStarterProperties) {
  const existingById = new Map(existingProperties.map((propertyListing) => [propertyListing.id, propertyListing]));
  const starterById = new Map(enrichedStarterProperties.map((propertyListing) => [propertyListing.id, propertyListing]));
  const mergedStarterRecords = enrichedStarterProperties.map((starterProperty) => {
    const existingProperty = existingById.get(starterProperty.id);
    if (!existingProperty) return starterProperty;

    return {
      ...starterProperty,
      ...existingProperty,
      imageUrl: starterProperty.imageUrl,
      visualTags: starterProperty.visualTags,
      lifestyleTags: starterProperty.lifestyleTags,
      amenities: starterProperty.amenities,
      noiseLevel: starterProperty.noiseLevel,
      safetyScore: starterProperty.safetyScore,
      walkabilityScore: starterProperty.walkabilityScore,
      documentStatus: starterProperty.documentStatus,
      expectedRent: starterProperty.expectedRent,
      priceDroppedPercent: starterProperty.priceDroppedPercent,
      priceHistory: starterProperty.priceHistory,
      coordinates: starterProperty.coordinates,
      status: existingProperty.status ?? starterProperty.status,
      verified: existingProperty.verified ?? starterProperty.verified
    };
  });

  const customRecords = existingProperties
    .filter((propertyListing) => !starterById.has(propertyListing.id))
    .map(enrichPropertyRecord);

  return [...mergedStarterRecords, ...customRecords];
}

export { STORAGE_KEYS };

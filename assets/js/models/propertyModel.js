export const propertyTypes = ["Apartment", "Villa", "Independent House", "Plot", "Studio"];

export const propertyStatus = {
  approved: "approved",
  review: "review",
  rejected: "rejected"
};

export function createPropertyRecord(listingForm, ownerEmail) {
  const now = new Date().toISOString();

  return {
    id: `home-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    title: listingForm.title.trim(),
    location: listingForm.location.trim(),
    neighborhood: listingForm.neighborhood.trim(),
    price: Number(listingForm.price),
    type: listingForm.type,
    bedrooms: Number(listingForm.bedrooms),
    bathrooms: Number(listingForm.bathrooms),
    areaSqft: Number(listingForm.areaSqft),
    imageUrl: String(listingForm.imageUrl || "").trim() || "./assets/images/land2.jpg",
    description: listingForm.description.trim(),
    agentName: listingForm.agentName.trim(),
    agentPhone: listingForm.agentPhone.trim(),
    ownerEmail,
    status: propertyStatus.review,
    verified: false,
    featured: false,
    documentStatus: listingForm.documentStatus || "Documents pending review",
    visualTags: normalizeTags(listingForm.visualTags || "modern"),
    lifestyleTags: normalizeTags(listingForm.lifestyleTags || "balanced"),
    amenities: normalizeTags(listingForm.amenities || ""),
    noiseLevel: listingForm.noiseLevel || "Medium",
    safetyScore: Number(listingForm.safetyScore || 74),
    walkabilityScore: Number(listingForm.walkabilityScore || 70),
    expectedRent: Number(listingForm.expectedRent || 0),
    priceDroppedPercent: 0,
    priceHistory: [Number(listingForm.price)],
    coordinates: null,
    postedAt: now,
    updatedAt: now,
    inspectionReady: Boolean(listingForm.inspectionReady),
    score: 72
  };
}

function normalizeTags(rawTags) {
  if (Array.isArray(rawTags)) return rawTags;

  return String(rawTags)
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

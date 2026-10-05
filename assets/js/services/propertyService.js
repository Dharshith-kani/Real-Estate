import { getCurrentUser } from "./authService.js";
import { propertyStatus, propertyTypes, createPropertyRecord } from "../models/propertyModel.js";
import { readCollection, STORAGE_KEYS, writeCollection } from "./storageService.js";

export function getAllProperties() {
  return readCollection(STORAGE_KEYS.properties);
}

export function getApprovedProperties() {
  return getAllProperties().filter((propertyListing) => propertyListing.status === propertyStatus.approved);
}

export function getFeaturedProperties() {
  return getApprovedProperties()
    .filter((propertyListing) => propertyListing.featured)
    .sort((firstListing, secondListing) => secondListing.score - firstListing.score)
    .slice(0, 3);
}

export function findPropertyById(propertyId) {
  return getAllProperties().find((propertyListing) => propertyListing.id === propertyId) || null;
}

export function createListing(listingForm, ownerEmail) {
  if (!ownerEmail || getCurrentUser()?.email !== ownerEmail) {
    throw new Error("Please login before listing a property.");
  }

  const requiredFields = ["title", "location", "neighborhood", "price", "type", "areaSqft", "agentName", "agentPhone", "description"];
  const missingField = requiredFields.find((fieldName) => !String(listingForm[fieldName] || "").trim());

  if (missingField) {
    throw new Error("Please complete all required listing details.");
  }

  if (![listingForm.price, listingForm.areaSqft].every(value => Number.isFinite(Number(value)) && Number(value) > 0)) {
    throw new Error("Price and area must be greater than zero.");
  }

  if (!propertyTypes.includes(listingForm.type)) throw new Error("Choose a valid property type.");
  for (const field of ["bedrooms", "bathrooms", "expectedRent", "safetyScore", "walkabilityScore"]) {
    const value = Number(listingForm[field] || 0);
    if (!Number.isFinite(value) || value < 0 || (["bedrooms", "bathrooms"].includes(field) && !Number.isInteger(value)) || (["safetyScore", "walkabilityScore"].includes(field) && value > 100)) {
      throw new Error(`Enter a valid ${field} value.`);
    }
  }
  if (listingForm.type === "Plot") { listingForm.bedrooms = 0; listingForm.bathrooms = 0; }
  if (!/^[+\d\s()-]{7,20}$/.test(listingForm.agentPhone.trim())) throw new Error("Enter a valid agent phone number.");
  const image = String(listingForm.imageUrl || "").trim();
  if (image && !/^https?:\/\//i.test(image) && !/^\.\/assets\/images\/[a-z0-9_-]+\.(jpe?g|png|webp)$/i.test(image)) {
    throw new Error("Use an HTTP(S) image URL or a bundled image path.");
  }
  const newProperty = createPropertyRecord(listingForm, ownerEmail);
  writeCollection(STORAGE_KEYS.properties, [newProperty, ...getAllProperties()]);
  return newProperty;
}

export function searchProperties(filters = {}) {
  const budgetLimit = Number(filters.budget || filters.maxPrice || 0);
  const minimumBedrooms = Number(filters.bedrooms || 0);
  const locationQuery = String(filters.location || "").trim().toLowerCase();
  const typeQuery = String(filters.type || "").trim();
  const styleQuery = String(filters.style || "").trim().toLowerCase();
  const lifestyleQuery = String(filters.lifestyle || "").trim().toLowerCase();
  const investmentOnly = String(filters.investment || "") === "true";
  const approvedListings = getApprovedProperties();

  let matchedListings = approvedListings.filter((propertyListing) => {
    const matchesLocation = !locationQuery ||
      propertyListing.location.toLowerCase().includes(locationQuery) ||
      propertyListing.neighborhood.toLowerCase().includes(locationQuery);
    const matchesBudget = !budgetLimit || propertyListing.price <= budgetLimit;
    const matchesType = !typeQuery || propertyListing.type === typeQuery;
    const matchesBedrooms = !minimumBedrooms || propertyListing.bedrooms >= minimumBedrooms;
    const matchesStyle = !styleQuery || (propertyListing.visualTags || []).includes(styleQuery);
    const matchesLifestyle = !lifestyleQuery || (propertyListing.lifestyleTags || []).includes(lifestyleQuery);
    const matchesInvestment = !investmentOnly || Number(propertyListing.expectedRent || 0) > 0;

    return matchesLocation && matchesBudget && matchesType && matchesBedrooms && matchesStyle && matchesLifestyle && matchesInvestment;
  });

  if (filters.sortBy === "price-low") {
    matchedListings = matchedListings.sort((firstListing, secondListing) => firstListing.price - secondListing.price);
  }

  if (filters.sortBy === "price-high") {
    matchedListings = matchedListings.sort((firstListing, secondListing) => secondListing.price - firstListing.price);
  }

  if (filters.sortBy === "newest") {
    matchedListings = matchedListings.sort((firstListing, secondListing) => new Date(secondListing.postedAt) - new Date(firstListing.postedAt));
  }

  return matchedListings;
}

export function updatePropertyStatus(propertyId, nextStatus) {
  if (getCurrentUser()?.role !== "admin") throw new Error("Admin access required.");
  const knownStatuses = Object.values(propertyStatus);

  if (!knownStatuses.includes(nextStatus)) {
    throw new Error("Unknown property status.");
  }

  const updatedProperties = getAllProperties().map((propertyListing) => {
    if (propertyListing.id !== propertyId) return propertyListing;

    return {
      ...propertyListing,
      status: nextStatus,
      verified: nextStatus === propertyStatus.approved,
      updatedAt: new Date().toISOString()
    };
  });

  writeCollection(STORAGE_KEYS.properties, updatedProperties);
}

export function removeProperty(propertyId) {
  const user = getCurrentUser();
  const property = findPropertyById(propertyId);
  if (!user || (user.role !== "admin" && property?.ownerEmail !== user.email)) throw new Error("You cannot remove this listing.");
  for (const key of [STORAGE_KEYS.comparison, STORAGE_KEYS.recentlyViewed]) {
    writeCollection(key, readCollection(key).filter(id => id !== propertyId));
  }
  writeCollection(STORAGE_KEYS.users, readCollection(STORAGE_KEYS.users).map(user => ({...user, savedPropertyIds: (user.savedPropertyIds || []).filter(id => id !== propertyId)})));
  writeCollection(
    STORAGE_KEYS.properties,
    getAllProperties().filter((propertyListing) => propertyListing.id !== propertyId)
  );
}

import { readCollection, STORAGE_KEYS, writeCollection } from "./storageService.js";

const defaultBuyerProfile = {
  preferredLocation: "Bengaluru",
  maxBudget: 20000000,
  bedrooms: 3,
  propertyType: "",
  monthlyIncome: 280000,
  downPayment: 3500000,
  commuteHub: "Tech Park",
  lifestylePreference: "quiet",
  familySize: 4,
  priority: "balanced"
};

export function getDefaultBuyerProfile() {
  return { ...defaultBuyerProfile };
}

export function getBuyerProfile() {
  try {
    const savedProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.buyerProfile) || "null");
    return savedProfile ? { ...defaultBuyerProfile, ...savedProfile } : null;
  } catch (error) {
    console.warn("Buyer profile could not be loaded", error);
    return null;
  }
}

export function getBuyerProfileOrDefault() {
  return getBuyerProfile() || getDefaultBuyerProfile();
}

export function saveBuyerProfile(profileForm) {
  const nextProfile = {
    preferredLocation: String(profileForm.preferredLocation || "").trim(),
    maxBudget: Number(profileForm.maxBudget ?? defaultBuyerProfile.maxBudget),
    bedrooms: Number(profileForm.bedrooms ?? defaultBuyerProfile.bedrooms),
    propertyType: String(profileForm.propertyType || "").trim(),
    monthlyIncome: Number(profileForm.monthlyIncome ?? defaultBuyerProfile.monthlyIncome),
    downPayment: Number(profileForm.downPayment || 0),
    commuteHub: String(profileForm.commuteHub || defaultBuyerProfile.commuteHub).trim(),
    lifestylePreference: String(profileForm.lifestylePreference || defaultBuyerProfile.lifestylePreference).trim(),
    familySize: Number(profileForm.familySize || defaultBuyerProfile.familySize),
    priority: String(profileForm.priority || "balanced")
  };

  if (![nextProfile.maxBudget, nextProfile.monthlyIncome, nextProfile.downPayment, nextProfile.bedrooms, nextProfile.familySize].every(Number.isFinite) || nextProfile.downPayment < 0 || nextProfile.bedrooms < 0 || nextProfile.familySize < 1 || nextProfile.maxBudget <= 0 || nextProfile.monthlyIncome <= 0) {
    throw new Error("Budget and income should be greater than zero.");
  }

  localStorage.setItem(STORAGE_KEYS.buyerProfile, JSON.stringify(nextProfile));
  return nextProfile;
}

export function getComparisonIds() {
  return readCollection(STORAGE_KEYS.comparison).slice(0, 3);
}

export function toggleCompareProperty(propertyId) {
  const comparisonIds = new Set(getComparisonIds());

  if (comparisonIds.has(propertyId)) {
    comparisonIds.delete(propertyId);
    writeCollection(STORAGE_KEYS.comparison, [...comparisonIds]);
    return { selected: false, ids: [...comparisonIds] };
  }

  if (comparisonIds.size >= 3) {
    throw new Error("Compare up to three properties at a time.");
  }

  comparisonIds.add(propertyId);
  writeCollection(STORAGE_KEYS.comparison, [...comparisonIds]);
  return { selected: true, ids: [...comparisonIds] };
}

export function clearComparison() {
  writeCollection(STORAGE_KEYS.comparison, []);
}

export function getSearchAlerts() {
  return readCollection(STORAGE_KEYS.searchAlerts);
}

export function saveSearchAlert(filters) {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, fieldValue]) => String(fieldValue || "").trim())
  );

  if (!Object.keys(cleanFilters).length) {
    throw new Error("Apply at least one filter before saving an alert.");
  }

  const querySignature = new URLSearchParams(cleanFilters).toString();
  const currentAlerts = getSearchAlerts();
  const existingAlert = currentAlerts.find((searchAlert) => searchAlert.querySignature === querySignature);

  if (existingAlert) {
    return existingAlert;
  }

  const searchAlert = {
    id: `alert-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    querySignature,
    filters: cleanFilters,
    label: buildSearchAlertLabel(cleanFilters),
    createdAt: new Date().toISOString()
  };

  writeCollection(STORAGE_KEYS.searchAlerts, [searchAlert, ...currentAlerts].slice(0, 6));
  return searchAlert;
}

export function removeSearchAlert(alertId) {
  writeCollection(
    STORAGE_KEYS.searchAlerts,
    getSearchAlerts().filter((searchAlert) => searchAlert.id !== alertId)
  );
}

export function getRecentlyViewedIds() {
  return readCollection(STORAGE_KEYS.recentlyViewed).slice(0, 8);
}

export function trackRecentlyViewed(propertyId) {
  if (!propertyId) return;

  const recentIds = getRecentlyViewedIds().filter((recentId) => recentId !== propertyId);
  writeCollection(STORAGE_KEYS.recentlyViewed, [propertyId, ...recentIds].slice(0, 8));
}

function buildSearchAlertLabel(filters) {
  const labelParts = [];
  if (filters.location) labelParts.push(filters.location);
  if (filters.type) labelParts.push(filters.type);
  if (filters.bedrooms) labelParts.push(`${filters.bedrooms}+ beds`);
  if (filters.budget) labelParts.push(`under ${Number(filters.budget).toLocaleString("en-IN")}`);
  if (filters.style) labelParts.push(`${filters.style} style`);
  if (filters.lifestyle) labelParts.push(`${filters.lifestyle} lifestyle`);

  return labelParts.join(" / ") || "Saved property search";
}

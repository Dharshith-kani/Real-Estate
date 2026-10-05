import { getCurrentUser } from "./authService.js";
import { findPropertyById } from "./propertyService.js";
import { readCollection, writeCollection, STORAGE_KEYS } from "./storageService.js";

export function createEnquiry(propertyId, details) {
  const property = findPropertyById(propertyId);
  if (!property || property.status !== "approved") throw new Error("This listing is unavailable.");
  const name = String(details.name || "").trim();
  const phone = String(details.phone || "").trim();
  if (!name || !/^[+\d\s()-]{7,20}$/.test(phone)) throw new Error("Enter your name and a valid phone number.");
  const today = new Date().toLocaleDateString("en-CA");
  if (details.visitDate && (!/^\d{4}-\d{2}-\d{2}$/.test(details.visitDate) || details.visitDate < today)) throw new Error("Choose today or a future visit date.");
  const enquiry = {
    id: `enquiry-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
    propertyId, ownerEmail: property.ownerEmail, buyerEmail: getCurrentUser()?.email || null,
    name, phone, message: String(details.message || "").trim().slice(0, 2000),
    visitDate: details.visitDate || "", visitSlot: details.visitSlot || "Morning",
    status: "new", createdAt: new Date().toISOString()
  };
  writeCollection(STORAGE_KEYS.enquiries, [enquiry, ...readCollection(STORAGE_KEYS.enquiries)]);
  return enquiry;
}

export function getSellerEnquiries() {
  const user = getCurrentUser();
  if (!user) return [];
  return readCollection(STORAGE_KEYS.enquiries).filter(enquiry => user.role === "admin" || enquiry.ownerEmail === user.email);
}

export function updateEnquiryStatus(id, status) {
  if (!["new", "contacted", "closed"].includes(status)) throw new Error("Invalid enquiry status.");
  if (!getSellerEnquiries().some(enquiry => enquiry.id === id)) throw new Error("You cannot change this enquiry.");
  writeCollection(STORAGE_KEYS.enquiries, readCollection(STORAGE_KEYS.enquiries).map(enquiry => enquiry.id === id ? {...enquiry, status} : enquiry));
}

import { getCurrentUser } from "../services/authService.js";
import { getAllProperties, removeProperty } from "../services/propertyService.js";
import { getSellerEnquiries, updateEnquiryStatus } from "../services/enquiryService.js";
import { escapeHtml, formatDate, formatPrice, renderStatusBadge, showToast } from "../views/templates.js";

export function renderSellerPage(appRoot) {
  const user = getCurrentUser();
  if (!user) {
    appRoot.innerHTML = `<section class="section-block"><div class="container"><div class="empty-state"><h1 class="h3">Login to manage your listings</h1><p>Track moderation and enquiries in your seller workspace.</p><a class="btn btn-primary" href="#/login">Login</a></div></div></section>`;
    return;
  }
  const properties = getAllProperties().filter(property => user.role === "admin" || property.ownerEmail === user.email);
  const enquiries = getSellerEnquiries();
  appRoot.innerHTML = `<section class="section-block"><div class="container">
    <div class="d-flex flex-wrap justify-content-between gap-3 mb-4"><div><h1 class="section-title">Your seller workspace</h1><p class="section-kicker">Track listing approval and manage enquiries saved in this browser.</p></div><a class="btn btn-primary align-self-start" href="#/sell">List a property</a></div>
    <div class="row g-3 mb-4"><div class="col-md-4"><div class="stat-tile"><span>Total listings</span><h2>${properties.length}</h2></div></div><div class="col-md-4"><div class="stat-tile"><span>Awaiting approval</span><h2>${properties.filter(property => property.status === "review").length}</h2></div></div><div class="col-md-4"><div class="stat-tile"><span>New enquiries</span><h2>${enquiries.filter(enquiry => enquiry.status === "new").length}</h2></div></div></div>
    <div class="advanced-panel mb-4"><h2 class="h5 fw-bold">My listings</h2>${properties.length ? `<div class="table-responsive"><table class="table align-middle"><thead><tr><th>Property</th><th>Price</th><th>Status</th><th>Action</th></tr></thead><tbody>${properties.map(property => `<tr><td><strong>${escapeHtml(property.title)}</strong><div class="small text-secondary">${escapeHtml(property.location)}</div></td><td>${formatPrice(property.price)}</td><td>${renderStatusBadge(property)}</td><td><div class="d-flex gap-2">${property.status === "approved" ? `<a class="btn btn-sm btn-outline-primary" href="#/properties/${property.id}">View</a>` : ""}<button class="btn btn-sm btn-outline-danger" data-remove-own="${property.id}">Remove</button></div></td></tr>`).join("")}</tbody></table></div>` : `<p class="text-secondary">You haven’t submitted a listing yet.</p>`}</div>
    <div class="advanced-panel"><h2 class="h5 fw-bold">Enquiry inbox</h2><p class="small text-secondary">Local demo records only. No email, SMS, or callback is sent.</p>${enquiries.length ? `<div class="row g-3">${enquiries.map(enquiry => {
      const property = getAllProperties().find(property => property.id === enquiry.propertyId);
      return `<div class="col-md-6"><article class="enquiry-card"><div class="d-flex justify-content-between gap-2"><h3 class="h6 fw-bold">${escapeHtml(enquiry.name)}</h3><span class="badge text-bg-light">${escapeHtml(enquiry.status)}</span></div><p class="small mb-1">${escapeHtml(property?.title || "Removed listing")} · ${escapeHtml(enquiry.phone)}</p><p class="small text-secondary">${formatDate(enquiry.createdAt)}${enquiry.visitDate ? ` · Visit ${escapeHtml(enquiry.visitDate)}, ${escapeHtml(enquiry.visitSlot)}` : ""}</p><p class="enquiry-message">${escapeHtml(enquiry.message)}</p><label class="form-label small" for="status-${enquiry.id}">Enquiry status</label><select class="form-select form-select-sm" id="status-${enquiry.id}" data-enquiry-status="${enquiry.id}">${["new", "contacted", "closed"].map(status => `<option value="${status}" ${status === enquiry.status ? "selected" : ""}>${status}</option>`).join("")}</select></article></div>`;
    }).join("")}</div>` : `<p class="text-secondary mb-0">No enquiries yet. Submit a callback request on an approved property to try this flow.</p>`}</div>
  </div></section>`;
  appRoot.querySelectorAll("[data-remove-own]").forEach(button => button.addEventListener("click", () => {
    if (!confirm("Remove this property listing?")) return;
    try { removeProperty(button.dataset.removeOwn); renderSellerPage(appRoot); showToast("Listing removed.", "success"); }
    catch (error) { showToast(error.message, "danger"); }
  }));
  appRoot.querySelectorAll("[data-enquiry-status]").forEach(select => select.addEventListener("change", () => {
    try { updateEnquiryStatus(select.dataset.enquiryStatus, select.value); renderSellerPage(appRoot); showToast("Enquiry updated.", "success"); }
    catch (error) { showToast(error.message, "danger"); }
  }));
}

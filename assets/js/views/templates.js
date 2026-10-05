import { propertyStatus, propertyTypes } from "../models/propertyModel.js";
import { calculateInvestmentMetrics, calculateMarketSignal, calculateMatchScore } from "../services/insightsService.js";

export function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(price);
}

export function formatDate(dateText) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(dateText));
}

export function escapeHtml(rawText = "") {
  return String(rawText)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderTypeOptions(selectedType = "") {
  return [
    `<option value="">Any property type</option>`,
    ...propertyTypes.map((propertyType) => {
      const selected = propertyType === selectedType ? "selected" : "";
      return `<option value="${propertyType}" ${selected}>${propertyType}</option>`;
    })
  ].join("");
}

export function renderPropertyCard(propertyListing, currentUser = null, options = {}) {
  const savedPropertyIds = currentUser?.savedPropertyIds || [];
  const isSaved = savedPropertyIds.includes(propertyListing.id);
  const compareIds = options.compareIds || [];
  const isCompared = compareIds.includes(propertyListing.id);
  const matchResult = calculateMatchScore(propertyListing, options.buyerProfile);
  const marketSignal = calculateMarketSignal(propertyListing);
  const investmentMetrics = calculateInvestmentMetrics(propertyListing);
  const bedroomText = propertyListing.bedrooms ? `${propertyListing.bedrooms} Beds` : "Plot";
  const bathroomText = propertyListing.bathrooms ? `${propertyListing.bathrooms} Baths` : "Land parcel";

  return `
    <article class="property-card">
      <div class="property-image-wrap">
        <img src="${escapeHtml(propertyListing.imageUrl)}" alt="${escapeHtml(propertyListing.title)}" loading="lazy" onerror="this.onerror=null;this.src='./assets/images/land2.jpg'">
        ${matchResult ? `<span class="match-badge"><i class="bi bi-stars"></i> ${matchResult.score}% match</span>` : ""}
        ${propertyListing.priceDroppedPercent ? `<span class="price-drop-badge">${propertyListing.priceDroppedPercent}% drop</span>` : ""}
      </div>
      <div class="p-3">
        <div class="d-flex justify-content-between gap-2 align-items-start">
          <div>
            <div class="property-price">${formatPrice(propertyListing.price)}</div>
            <h3 class="h5 mt-1 mb-1">${escapeHtml(propertyListing.title)}</h3>
          </div>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-secondary saved-button ${isSaved ? "active" : ""}" data-save-property="${propertyListing.id}" aria-label="Save ${escapeHtml(propertyListing.title)}">
              <i class="bi ${isSaved ? "bi-heart-fill" : "bi-heart"}"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary compare-button ${isCompared ? "active" : ""}" data-compare-property="${propertyListing.id}" aria-label="Compare ${escapeHtml(propertyListing.title)}">
              <i class="bi ${isCompared ? "bi-check2-square" : "bi-plus-square"}"></i>
            </button>
          </div>
        </div>
        <p class="text-secondary mb-2"><i class="bi bi-geo-alt"></i> ${escapeHtml(propertyListing.neighborhood)}, ${escapeHtml(propertyListing.location)}</p>
        <div class="property-meta mb-3">
          <span><i class="bi bi-door-open"></i> ${bedroomText}</span>
          <span><i class="bi bi-droplet"></i> ${bathroomText}</span>
          <span><i class="bi bi-rulers"></i> ${propertyListing.areaSqft.toLocaleString("en-IN")} sqft</span>
        </div>
        <div class="d-flex flex-wrap gap-2 mb-3">
          ${renderStatusBadge(propertyListing)}
          <span class="status-badge signal-${marketSignal.tone}"><i class="bi bi-activity"></i> ${marketSignal.label}</span>
          ${investmentMetrics.roiScore >= 70 ? `<span class="status-badge signal-success"><i class="bi bi-bar-chart"></i> ${investmentMetrics.label}</span>` : ""}
        </div>
        <div class="visual-tag-row">
          ${(propertyListing.visualTags || []).slice(0, 3).map((visualTag) => `<span>${escapeHtml(visualTag)}</span>`).join("")}
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="small text-secondary">${Math.round(marketSignal.pricePerSqft).toLocaleString("en-IN")}/sqft</span>
          <a class="btn btn-sm btn-primary" href="#/properties/${propertyListing.id}">View details</a>
        </div>
      </div>
    </article>
  `;
}

export function renderStatusBadge(propertyListing) {
  if (propertyListing.status === propertyStatus.rejected) {
    return `<span class="status-badge status-rejected"><i class="bi bi-x-circle"></i> Rejected</span>`;
  }

  if (propertyListing.status === propertyStatus.review) {
    return `<span class="status-badge status-review"><i class="bi bi-hourglass-split"></i> In review</span>`;
  }

  return `<span class="status-badge status-verified"><i class="bi bi-patch-check-fill"></i> Demo approved</span>`;
}

export function showToast(message, tone = "primary") {
  const toastRegion = document.querySelector("#toastRegion");
  if (!toastRegion || !window.bootstrap) {
    console.log(message);
    return;
  }

  const toastElement = document.createElement("div");
  toastElement.className = `toast align-items-center text-bg-${tone} border-0`;
  toastElement.setAttribute("role", "status");
  toastElement.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${escapeHtml(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastRegion.appendChild(toastElement);
  const toast = new bootstrap.Toast(toastElement, { delay: 2600 });
  toast.show();
  toastElement.addEventListener("hidden.bs.toast", () => toastElement.remove());
}

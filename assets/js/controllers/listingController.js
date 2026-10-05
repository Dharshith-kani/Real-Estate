import { createEnquiry } from "../services/enquiryService.js";
import { propertyStatus, propertyTypes } from "../models/propertyModel.js";
import { getCurrentUser } from "../services/authService.js";
import { getBuyerProfile, getBuyerProfileOrDefault, getComparisonIds, getSearchAlerts, removeSearchAlert, saveBuyerProfile, saveSearchAlert, trackRecentlyViewed } from "../services/buyerToolsService.js";
import { calculateAffordability, calculateInvestmentMetrics, calculateMarketSignal, calculateMatchScore, getPropertyInsight, getRiskSignals } from "../services/insightsService.js";
import { createListing, findPropertyById, getAllProperties, removeProperty, searchProperties, updatePropertyStatus } from "../services/propertyService.js";
import { bindCompareActions, renderComparisonTray } from "./comparisonController.js";
import { bindSaveButtons } from "./homeController.js";
import { escapeHtml, formatDate, formatPrice, renderPropertyCard, renderStatusBadge, renderTypeOptions, showToast } from "../views/templates.js";

export function renderPropertiesPage(appRoot, routeQuery = "", showSkeleton = true) {
  if (showSkeleton) {
    appRoot.innerHTML = renderPropertiesSkeleton();
    const pendingHash = location.hash;
    const skeleton = appRoot.firstElementChild;
    setTimeout(() => {
      if (location.hash === pendingHash && appRoot.firstElementChild === skeleton) renderPropertiesPage(appRoot, routeQuery, false);
    }, 180);
    return;
  }

  const filters = Object.fromEntries(new URLSearchParams(routeQuery));
  const profileDraft = getBuyerProfileOrDefault();
  const buyerProfile = getBuyerProfile();
  const compareIds = getComparisonIds();
  const searchAlerts = getSearchAlerts();
  let matchedListings = searchProperties(filters);
  const currentUser = getCurrentUser();

  if (filters.sortBy === "match") {
    matchedListings = matchedListings.sort((firstListing, secondListing) => {
      return calculateMatchScore(secondListing, profileDraft).score - calculateMatchScore(firstListing, profileDraft).score;
    });
  }

  appRoot.innerHTML = `
    <section class="section-block">
      <div class="container">
        <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-end mb-4">
          <div>
            <h1 class="section-title">Property discovery</h1>
            <p class="section-kicker mb-0">Filter verified homes by location, budget, property type, bedroom needs, and personal match quality.</p>
          </div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <span class="text-secondary">${matchedListings.length} approved listing${matchedListings.length === 1 ? "" : "s"} found</span>
            <button class="btn btn-outline-success btn-sm" id="saveSearchAlertButton"><i class="bi bi-bell"></i> Save alert</button>
          </div>
        </div>

        <div class="row g-4 listing-layout">
          <aside class="col-lg-3">
            <form class="filter-panel row g-3" id="propertyFilterForm">
              <div class="col-12">
                <label class="form-label" for="filterLocation">Location</label>
                <input class="form-control" id="filterLocation" name="location" value="${escapeHtml(filters.location || "")}" placeholder="Mumbai, Whitefield...">
              </div>
              <div class="col-12">
                <label class="form-label" for="filterBudget">Max budget</label>
                <select class="form-select" id="filterBudget" name="budget">
                  ${renderBudgetOptions(filters.budget || filters.maxPrice)}
                </select>
              </div>
              <div class="col-12">
                <label class="form-label" for="filterType">Type</label>
                <select class="form-select" id="filterType" name="type">
                  ${renderTypeOptions(filters.type || "")}
                </select>
              </div>
              <div class="col-12">
                <label class="form-label" for="filterStyle">Visual style</label>
                <select class="form-select" id="filterStyle" name="style">
                  ${renderStyleOptions(filters.style || "")}
                </select>
              </div>
              <div class="col-12">
                <label class="form-label" for="filterLifestyle">Lifestyle</label>
                <select class="form-select" id="filterLifestyle" name="lifestyle">
                  ${renderLifestyleFilterOptions(filters.lifestyle || "")}
                </select>
              </div>
              <div class="col-12">
                <label class="form-label" for="filterBedrooms">Bedrooms</label>
                <select class="form-select" id="filterBedrooms" name="bedrooms">
                  ${renderBedroomOptions(filters.bedrooms)}
                </select>
              </div>
              <div class="col-12">
                <label class="form-label" for="filterSort">Sort</label>
                <select class="form-select" id="filterSort" name="sortBy">
                  ${renderSortOptions(filters.sortBy)}
                </select>
              </div>
              <div class="col-12 d-grid gap-2">
                <button class="btn btn-primary" type="submit"><i class="bi bi-sliders"></i> Apply filters</button>
                <a class="btn btn-outline-secondary" href="#/properties">Reset</a>
              </div>
            </form>
            <form class="filter-panel row g-3 mt-3" id="quickBuyerProfileForm">
              <div class="col-12">
                <h2 class="h6 fw-bold mb-1"><i class="bi bi-stars"></i> Match profile</h2>
                <p class="small text-secondary mb-0">${buyerProfile ? "Personalized ranking is active." : "Using default buyer assumptions."}</p>
              </div>
              <div class="col-12">
                <label class="form-label" for="quickProfileLocation">Preferred location</label>
                <input class="form-control" id="quickProfileLocation" name="preferredLocation" value="${escapeHtml(profileDraft.preferredLocation)}">
              </div>
              <div class="col-12">
                <label class="form-label" for="quickProfileBudget">Max budget</label>
                <input class="form-control" id="quickProfileBudget" name="maxBudget" type="number" min="1" value="${profileDraft.maxBudget}">
              </div>
              <div class="col-6">
                <label class="form-label" for="quickProfileBedrooms">Beds</label>
                <input class="form-control" id="quickProfileBedrooms" name="bedrooms" type="number" min="0" value="${profileDraft.bedrooms}">
              </div>
              <div class="col-6">
                <label class="form-label" for="quickProfilePriority">Priority</label>
                <select class="form-select" id="quickProfilePriority" name="priority">
                  ${renderPriorityOptions(profileDraft.priority)}
                </select>
              </div>
              <input type="hidden" name="propertyType" value="${escapeHtml(profileDraft.propertyType)}">
              <input type="hidden" name="monthlyIncome" value="${profileDraft.monthlyIncome}">
              <input type="hidden" name="downPayment" value="${profileDraft.downPayment}">
              <input type="hidden" name="commuteHub" value="${escapeHtml(profileDraft.commuteHub)}">
              <div class="col-6">
                <label class="form-label" for="quickProfileLifestyle">Lifestyle</label>
                <select class="form-select" id="quickProfileLifestyle" name="lifestylePreference">
                  ${renderLifestyleFilterOptions(profileDraft.lifestylePreference)}
                </select>
              </div>
              <div class="col-6">
                <label class="form-label" for="quickProfileFamilySize">Family</label>
                <input class="form-control" id="quickProfileFamilySize" name="familySize" type="number" min="1" value="${profileDraft.familySize}">
              </div>
              <div class="col-12 d-grid">
                <button class="btn btn-success" type="submit">Update match</button>
              </div>
            </form>
            <div class="filter-panel mt-3">
              <h2 class="h6 fw-bold mb-3"><i class="bi bi-bell"></i> Saved alerts</h2>
              ${renderSavedSearchAlerts(searchAlerts)}
            </div>
          </aside>
          <div class="col-lg-9">
            ${renderVisualSearchRail(filters)}
            <div class="advanced-panel mb-4">
              <div class="row g-3 align-items-center">
                <div class="col-lg-8">
                  <h2 class="h5 fw-bold mb-1">Smart discovery mode</h2>
                  <p class="text-secondary mb-0">Use "Smart match" sorting to rank homes by fit, risk, affordability, and neighborhood strength instead of only price or recency.</p>
                </div>
                <div class="col-lg-4 text-lg-end">
                  <a class="btn btn-outline-primary" href="#/properties?sortBy=match"><i class="bi bi-magic"></i> Sort by smart match</a>
                </div>
              </div>
            </div>
            ${renderInvestmentStrip(matchedListings)}
            ${renderLifestyleMap(matchedListings, profileDraft)}
            ${matchedListings.length ? `
              <div class="row g-4">
                ${matchedListings.map((propertyListing) => `
                  <div class="col-md-6 col-xl-4">${renderPropertyCard(propertyListing, currentUser, { buyerProfile: profileDraft, compareIds })}</div>
                `).join("")}
              </div>
            ` : `
              <div class="empty-state">
                <h2 class="h4 fw-bold">No verified homes match this search</h2>
                <p class="text-secondary">Try a nearby location, a higher budget, or another property type.</p>
                <a class="btn btn-primary" href="#/properties">Clear filters</a>
              </div>
            `}
          </div>
        </div>
        ${renderComparisonTray()}
      </div>
    </section>
  `;

  appRoot.querySelector("#propertyFilterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const filterForm = new FormData(event.currentTarget);
    const query = new URLSearchParams();

    for (const [fieldName, fieldValue] of filterForm.entries()) {
      if (String(fieldValue).trim()) {
        query.set(fieldName, fieldValue);
      }
    }

    location.hash = `#/properties${query.toString() ? `?${query}` : ""}`;
  });

  appRoot.querySelector("#quickBuyerProfileForm").addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      saveBuyerProfile(Object.fromEntries(new FormData(event.currentTarget)));
      showToast("Match profile updated.", "success");
      renderPropertiesPage(appRoot, routeQuery);
    } catch (error) {
      console.warn("Quick profile update failed", error);
      showToast(error.message, "danger");
    }
  });

  appRoot.querySelector("#saveSearchAlertButton").addEventListener("click", () => {
    try {
      saveSearchAlert(filters);
      showToast("Search alert saved.", "success");
      renderPropertiesPage(appRoot, routeQuery);
    } catch (error) {
      showToast(error.message, "warning");
    }
  });

  appRoot.querySelectorAll("[data-remove-alert]").forEach((alertButton) => {
    alertButton.addEventListener("click", () => {
      removeSearchAlert(alertButton.dataset.removeAlert);
      showToast("Search alert removed.", "secondary");
      renderPropertiesPage(appRoot, routeQuery);
    });
  });

  bindSaveButtons(appRoot);
  bindCompareActions(appRoot);
}

export function renderPropertyDetailPage(appRoot, propertyId) {
  const propertyListing = findPropertyById(propertyId);
  const currentUser = getCurrentUser();
  const profileDraft = getBuyerProfileOrDefault();

  if (!propertyListing || propertyListing.status !== propertyStatus.approved) {
    appRoot.innerHTML = `
      <section class="section-block">
        <div class="container">
          <div class="empty-state">
            <h1 class="h4 fw-bold">Property is unavailable</h1>
            <p class="text-secondary">It may still be under review or was removed by the admin team.</p>
            <a class="btn btn-primary" href="#/properties">Back to properties</a>
          </div>
        </div>
      </section>
    `;
    return;
  }

  const compareIds = getComparisonIds();
  const matchResult = calculateMatchScore(propertyListing, profileDraft);
  const insight = getPropertyInsight(propertyListing);
  const marketSignal = calculateMarketSignal(propertyListing);
  const affordability = calculateAffordability(propertyListing, profileDraft);
  const investmentMetrics = calculateInvestmentMetrics(propertyListing);
  const riskSignals = getRiskSignals(propertyListing);
  trackRecentlyViewed(propertyListing.id);

  appRoot.innerHTML = `
    <section class="section-block">
      <div class="container">
        <div class="mb-3">
          <a class="text-decoration-none" href="#/properties"><i class="bi bi-arrow-left"></i> Back to listings</a>
        </div>
        <div class="row g-4">
          <div class="col-lg-8">
            <img class="detail-hero-image" src="${escapeHtml(propertyListing.imageUrl)}" alt="${escapeHtml(propertyListing.title)}" loading="lazy" onerror="this.onerror=null;this.src='./assets/images/land2.jpg'">
            <div class="detail-panel mt-4">
              <div class="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <div class="property-price">${formatPrice(propertyListing.price)}</div>
                  <h1 class="h2 fw-bold mb-2">${escapeHtml(propertyListing.title)}</h1>
                  <p class="text-secondary mb-2"><i class="bi bi-geo-alt"></i> ${escapeHtml(propertyListing.neighborhood)}, ${escapeHtml(propertyListing.location)}</p>
                </div>
                <button class="btn btn-outline-secondary saved-button ${(currentUser?.savedPropertyIds || []).includes(propertyListing.id) ? "active" : ""}" data-save-property="${propertyListing.id}">
                  <i class="bi ${(currentUser?.savedPropertyIds || []).includes(propertyListing.id) ? "bi-heart-fill" : "bi-heart"}"></i>
                </button>
                <button class="btn btn-outline-secondary compare-button ${compareIds.includes(propertyListing.id) ? "active" : ""}" data-compare-property="${propertyListing.id}">
                  <i class="bi ${compareIds.includes(propertyListing.id) ? "bi-check2-square" : "bi-plus-square"}"></i>
                </button>
              </div>
              <div class="row g-3 my-2">
                ${renderDetailMetric("Type", propertyListing.type)}
                ${renderDetailMetric("Bedrooms", propertyListing.bedrooms || "Plot")}
                ${renderDetailMetric("Bathrooms", propertyListing.bathrooms || "N/A")}
                ${renderDetailMetric("Area", `${propertyListing.areaSqft.toLocaleString("en-IN")} sqft`)}
              </div>
              <h2 class="h5 fw-bold mt-4">Property overview</h2>
              <p class="text-secondary">${escapeHtml(propertyListing.description)}</p>
              <div class="row g-3 mt-3">
                ${renderInsightMetric("Transit", insight.transitScore)}
                ${renderInsightMetric("Schools", insight.schoolScore)}
                ${renderInsightMetric("Healthcare", insight.healthcareScore)}
              </div>
              <div class="mt-4">
                <h2 class="h5 fw-bold">Neighborhood intelligence</h2>
                <div class="row g-3">
                  ${renderNeighborhoodFact("Rental demand", insight.rentalDemand)}
                  ${renderNeighborhoodFact("Price trend", insight.priceTrend)}
                  ${renderNeighborhoodFact("Resale liquidity", insight.resaleLiquidity)}
                  ${renderNeighborhoodFact("Document health", insight.documentHealth)}
                  ${renderNeighborhoodFact("Noise level", propertyListing.noiseLevel || "Medium")}
                  ${renderNeighborhoodFact("Safety score", `${propertyListing.safetyScore || 74}/100`)}
                  ${renderNeighborhoodFact("Walkability", `${propertyListing.walkabilityScore || 70}/100`)}
                </div>
              </div>
            </div>
          </div>
          <aside class="col-lg-4">
            <div class="detail-panel mb-4">
              <div class="d-flex align-items-center gap-3">
                <div class="score-orb">${matchResult.score}%</div>
                <div>
                  <h2 class="h5 fw-bold mb-1">${matchResult.label}</h2>
                  <p class="small text-secondary mb-0">${matchResult.reasons.length ? matchResult.reasons.join(", ") : "Profile fit score"}</p>
                </div>
              </div>
              ${renderDecisionBreakdown(matchResult.categoryScores)}
            </div>
            <div class="detail-panel mb-4">
              <div class="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <h2 class="h5 fw-bold">Affordability guardrail</h2>
                  <p class="text-secondary mb-2">Estimated 20-year EMI at 8.6%.</p>
                </div>
                <span class="status-badge signal-${affordability.tone}">${affordability.label}</span>
              </div>
              <div class="property-price">${formatPrice(affordability.emi)} / mo</div>
              <div class="small text-secondary">${affordability.incomeShare}% of saved monthly income</div>
            </div>
            <div class="detail-panel mb-4">
              <h2 class="h5 fw-bold">Market guardrail</h2>
              <span class="status-badge signal-${marketSignal.tone} mb-2"><i class="bi bi-activity"></i> ${marketSignal.label}</span>
              <p class="text-secondary mb-3">${Math.round(marketSignal.pricePerSqft).toLocaleString("en-IN")} per sqft, ${Math.round(marketSignal.delta)}% versus the local benchmark.</p>
              ${renderRiskSignals(riskSignals)}
            </div>
            <div class="detail-panel mb-4">
              <div class="d-flex justify-content-between gap-2 align-items-start">
                <div>
                  <h2 class="h5 fw-bold">Investment mode</h2>
                  <p class="text-secondary mb-2">Rental income and projected appreciation model.</p>
                </div>
                <span class="status-badge signal-success">${investmentMetrics.label}</span>
              </div>
              <div class="row g-2">
                ${renderDetailMetric("Rent", `${formatPrice(investmentMetrics.expectedRent)} / mo`)}
                ${renderDetailMetric("Yield", `${investmentMetrics.grossYield}%`)}
                ${renderDetailMetric("ROI score", investmentMetrics.roiScore)}
                ${renderDetailMetric("Projected", formatPrice(investmentMetrics.projectedValue))}
              </div>
              ${renderMiniTrend(investmentMetrics.priceHistory)}
            </div>
            <div class="detail-panel mb-4">
              <div class="d-flex align-items-center justify-content-between mb-3">
                ${renderStatusBadge(propertyListing)}
                <span class="small text-secondary">Updated ${formatDate(propertyListing.updatedAt)}</span>
              </div>
              <h2 class="h5 fw-bold">Listing confidence</h2>
              <div class="progress mb-2" role="progressbar" aria-valuenow="${propertyListing.score}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-success" style="width: ${propertyListing.score}%">${propertyListing.score}%</div>
              </div>
              <div class="small text-secondary">Based on freshness, verification, inspection readiness, and agent history.</div>
            </div>
            <div class="detail-panel">
              <h2 class="h5 fw-bold">Contact agent</h2><p class="small text-secondary">Demo enquiries are saved locally. They are not sent to an agent.</p>
              <p class="mb-1 fw-semibold">${escapeHtml(propertyListing.agentName)}</p>
              <p class="text-secondary">${escapeHtml(propertyListing.agentPhone)}</p>
              <form id="leadForm" class="row g-3">
                <div class="col-12">
                  <label class="form-label" for="leadName">Name</label>
                  <input class="form-control" id="leadName" required>
                </div>
                <div class="col-12">
                  <label class="form-label" for="leadPhone">Phone</label>
                  <input class="form-control" id="leadPhone" required>
                </div>
                <div class="col-12">
                  <label class="form-label" for="leadMessage">Message</label>
                  <textarea class="form-control" id="leadMessage" rows="3">I would like to schedule a visit.</textarea>
                </div>
                <div class="col-6">
                  <label class="form-label" for="visitDate">Visit date</label>
                  <input class="form-control" id="visitDate" type="date" min="${new Date().toLocaleDateString("en-CA")}">
                </div>
                <div class="col-6">
                  <label class="form-label" for="visitSlot">Slot</label>
                  <select class="form-select" id="visitSlot">
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                  </select>
                </div>
                <div class="col-12 d-grid">
                  <button class="btn btn-success" type="submit">Request callback</button>
                </div>
              </form>
            </div>
          </aside>
        </div>
        ${renderComparisonTray()}
      </div>
    </section>
  `;

  appRoot.querySelector("#leadForm").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      createEnquiry(propertyListing.id, {
        name: appRoot.querySelector("#leadName").value,
        phone: appRoot.querySelector("#leadPhone").value,
        message: appRoot.querySelector("#leadMessage").value,
        visitDate: appRoot.querySelector("#visitDate").value,
        visitSlot: appRoot.querySelector("#visitSlot").value
      });
      showToast("Enquiry saved in the local seller inbox. No message was sent.", "success");
      event.currentTarget.reset();
    } catch (error) { showToast(error.message, "danger"); }
  });

  bindSaveButtons(appRoot);
  bindCompareActions(appRoot);
}

export function renderCreateListingPage(appRoot) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    appRoot.innerHTML = `
      <section class="section-block">
        <div class="container">
          <div class="empty-state">
            <h1 class="h4 fw-bold">Login to list a property</h1>
            <p class="text-secondary">Seller details are tied to an account so admins can review submissions.</p>
            <a class="btn btn-primary" href="#/login">Login</a>
          </div>
        </div>
      </section>
    `;
    return;
  }

  appRoot.innerHTML = `
    <section class="section-block">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-xl-9">
            <div class="detail-panel">
              <h1 class="section-title">Create a property listing</h1>
              <p class="section-kicker">New listings are sent to admin review before they appear in buyer search.</p>
              <form id="createListingForm" class="row g-3 mt-2">
                <div class="col-md-8">
                  <label class="form-label" for="listingTitle">Property title</label>
                  <input class="form-control" id="listingTitle" name="title" placeholder="Example: Lakeview 3BHK Apartment" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="listingType">Type</label>
                  <select class="form-select" id="listingType" name="type" required>
                    ${propertyTypes.map((propertyType) => `<option value="${propertyType}">${propertyType}</option>`).join("")}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="listingLocation">City</label>
                  <input class="form-control" id="listingLocation" name="location" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="listingNeighborhood">Neighborhood</label>
                  <input class="form-control" id="listingNeighborhood" name="neighborhood" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="listingPrice">Price</label>
                  <input class="form-control" id="listingPrice" name="price" type="number" min="1" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="listingBedrooms">Bedrooms</label>
                  <input class="form-control" id="listingBedrooms" name="bedrooms" type="number" min="0" value="2">
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="listingBathrooms">Bathrooms</label>
                  <input class="form-control" id="listingBathrooms" name="bathrooms" type="number" min="0" value="2">
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="listingArea">Area sqft</label>
                  <input class="form-control" id="listingArea" name="areaSqft" type="number" min="1" required>
                </div>
                <div class="col-md-8">
                  <label class="form-label" for="listingImage">Image URL</label>
                  <input class="form-control" id="listingImage" name="imageUrl" placeholder="Optional, falls back to uploaded hero image">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="listingAgent">Agent name</label>
                  <input class="form-control" id="listingAgent" name="agentName" value="${escapeHtml(currentUser.name)}" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="listingPhone">Agent phone</label>
                  <input class="form-control" id="listingPhone" name="agentPhone" required>
                </div>
                <div class="col-md-8">
                  <label class="form-label" for="listingDocuments">Document status</label>
                  <select class="form-select" id="listingDocuments" name="documentStatus">
                    <option>Title deed available</option>
                    <option>Tax receipts available</option>
                    <option>Society NOC pending</option>
                    <option>Documents pending review</option>
                  </select>
                </div>
                <div class="col-md-4 d-flex align-items-end">
                  <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="listingInspectionReady" name="inspectionReady">
                    <label class="form-check-label fw-semibold" for="listingInspectionReady">Inspection ready</label>
                  </div>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="listingVisualTags">Visual tags</label>
                  <input class="form-control" id="listingVisualTags" name="visualTags" placeholder="modern,luxury,minimal">
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="listingLifestyleTags">Lifestyle tags</label>
                  <input class="form-control" id="listingLifestyleTags" name="lifestyleTags" placeholder="quiet,family,investment">
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="listingExpectedRent">Expected rent</label>
                  <input class="form-control" id="listingExpectedRent" name="expectedRent" type="number" min="0" placeholder="Optional">
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="listingNoise">Noise level</label>
                  <select class="form-select" id="listingNoise" name="noiseLevel">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="listingSafety">Safety score</label>
                  <input class="form-control" id="listingSafety" name="safetyScore" type="number" min="1" max="100" value="74">
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="listingWalkability">Walkability</label>
                  <input class="form-control" id="listingWalkability" name="walkabilityScore" type="number" min="1" max="100" value="70">
                </div>
                <div class="col-12">
                  <label class="form-label" for="listingDescription">Description</label>
                  <textarea class="form-control" id="listingDescription" name="description" rows="4" required></textarea>
                </div>
                <div class="col-12 d-flex gap-2">
                  <button class="btn btn-primary" type="submit">Submit for review</button>
                  <a class="btn btn-outline-secondary" href="#/properties">Cancel</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  appRoot.querySelector("#createListingForm").addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      const listingForm = Object.fromEntries(new FormData(event.currentTarget));
      const createdProperty = createListing(listingForm, currentUser.email);
      showToast("Listing submitted for admin review.", "success");
      location.hash = `#/seller?highlight=${createdProperty.id}`;
    } catch (error) {
      console.warn("Listing creation failed", error);
      showToast(error.message, "danger");
    }
  });
}

export function renderAdminPage(appRoot) {
  const currentUser = getCurrentUser();

  if (currentUser?.role !== "admin") {
    appRoot.innerHTML = `
      <section class="section-block">
        <div class="container">
          <div class="empty-state">
            <h1 class="h4 fw-bold">Admin access required</h1>
            <p class="text-secondary">Login with the demo admin account to moderate listings.</p>
            <a class="btn btn-primary" href="#/login">Admin login</a>
          </div>
        </div>
      </section>
    `;
    return;
  }

  const allProperties = getAllProperties();
  const approvedCount = allProperties.filter((propertyListing) => propertyListing.status === propertyStatus.approved).length;
  const reviewCount = allProperties.filter((propertyListing) => propertyListing.status === propertyStatus.review).length;
  const rejectedCount = allProperties.filter((propertyListing) => propertyListing.status === propertyStatus.rejected).length;
  const riskCount = allProperties.filter((propertyListing) => getRiskSignals(propertyListing).length >= 2).length;

  appRoot.innerHTML = `
    <section class="section-block">
      <div class="container">
        <h1 class="section-title">Admin controls</h1>
        <p class="section-kicker">Review submitted listings, approve verified properties, reject bad submissions, or remove stale records.</p>

        <div class="row g-3 my-3">
          ${renderAdminStat("Approved", approvedCount, "bi-patch-check")}
          ${renderAdminStat("In review", reviewCount, "bi-hourglass-split")}
          ${renderAdminStat("Rejected", rejectedCount, "bi-x-octagon")}
          ${renderAdminStat("Risk queue", riskCount, "bi-shield-exclamation")}
        </div>

        <div class="admin-panel table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Property</th>
                <th>Location</th>
                <th>Price</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Updated</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${allProperties.map(renderAdminRow).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;

  appRoot.querySelectorAll("[data-admin-status]").forEach((actionButton) => {
    actionButton.addEventListener("click", () => {
      updatePropertyStatus(actionButton.dataset.propertyId, actionButton.dataset.adminStatus);
      showToast("Listing status updated.", "success");
      renderAdminPage(appRoot);
    });
  });

  appRoot.querySelectorAll("[data-admin-remove]").forEach((removeButton) => {
    removeButton.addEventListener("click", () => {
      const confirmed = confirm("Remove this listing from the portal?");
      if (!confirmed) return;

      removeProperty(removeButton.dataset.adminRemove);
      showToast("Listing removed.", "secondary");
      renderAdminPage(appRoot);
    });
  });
}

function renderBudgetOptions(selectedBudget = "") {
  const budgets = [
    ["", "Any budget"],
    ["7500000", "Under ₹75L"],
    ["12500000", "Under ₹1.25Cr"],
    ["20000000", "Under ₹2Cr"],
    ["35000000", "Under ₹3.5Cr"]
  ];

  if (selectedBudget && !budgets.some(([value]) => value === String(selectedBudget))) budgets.push([String(selectedBudget), `Under ${formatPrice(Number(selectedBudget))}`]);

  return budgets.map(([budgetValue, budgetLabel]) => {
    const selected = String(selectedBudget || "") === budgetValue ? "selected" : "";
    return `<option value="${budgetValue}" ${selected}>${budgetLabel}</option>`;
  }).join("");
}

function renderBedroomOptions(selectedBedrooms = "") {
  return [
    ["", "Any bedrooms"],
    ["1", "1+ bedrooms"],
    ["2", "2+ bedrooms"],
    ["3", "3+ bedrooms"],
    ["4", "4+ bedrooms"]
  ].map(([bedroomValue, bedroomLabel]) => {
    const selected = String(selectedBedrooms || "") === bedroomValue ? "selected" : "";
    return `<option value="${bedroomValue}" ${selected}>${bedroomLabel}</option>`;
  }).join("");
}

function renderSortOptions(selectedSort = "") {
  return [
    ["", "Recommended"],
    ["match", "Smart match"],
    ["newest", "Newest"],
    ["price-low", "Price: low to high"],
    ["price-high", "Price: high to low"]
  ].map(([sortValue, sortLabel]) => {
    const selected = String(selectedSort || "") === sortValue ? "selected" : "";
    return `<option value="${sortValue}" ${selected}>${sortLabel}</option>`;
  }).join("");
}

function renderStyleOptions(selectedStyle = "") {
  return [
    ["", "Any visual style"],
    ["modern", "Modern house"],
    ["luxury", "Luxury"],
    ["minimal", "Minimal interior"],
    ["city", "Urban"],
    ["eco", "Eco / land"],
    ["coastal", "Coastal"]
  ].map(([styleValue, styleLabel]) => {
    const selected = selectedStyle === styleValue ? "selected" : "";
    return `<option value="${styleValue}" ${selected}>${styleLabel}</option>`;
  }).join("");
}

function renderLifestyleFilterOptions(selectedLifestyle = "") {
  return [
    ["", "Any lifestyle"],
    ["quiet", "Quiet"],
    ["city", "City"],
    ["family", "Family"],
    ["commute", "Short commute"],
    ["investment", "Investment"]
  ].map(([lifestyleValue, lifestyleLabel]) => {
    const selected = selectedLifestyle === lifestyleValue ? "selected" : "";
    return `<option value="${lifestyleValue}" ${selected}>${lifestyleLabel}</option>`;
  }).join("");
}

function renderVisualSearchRail(filters) {
  const styles = [
    ["modern", "Modern", "bi-buildings"],
    ["luxury", "Luxury", "bi-gem"],
    ["minimal", "Minimal", "bi-square"],
    ["eco", "Eco land", "bi-tree"],
    ["city", "Urban", "bi-signpost-split"]
  ];

  return `
    <div class="advanced-panel visual-search-panel mb-4">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center">
        <div>
          <h2 class="h5 fw-bold mb-1">Visual search</h2>
          <p class="text-secondary mb-0">Filter homes by the design language buyers actually notice first.</p>
        </div>
        <div class="visual-search-chips">
          ${styles.map(([styleValue, styleLabel, iconName]) => {
            const active = filters.style === styleValue ? "active" : "";
            const query = new URLSearchParams({ ...filters, style: styleValue });
            return `<a class="visual-chip ${active}" href="#/properties?${query}"><i class="bi ${iconName}"></i> ${styleLabel}</a>`;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderInvestmentStrip(propertyListings) {
  const investmentPicks = propertyListings
    .map((propertyListing) => ({ propertyListing, metrics: calculateInvestmentMetrics(propertyListing) }))
    .filter(({ metrics }) => metrics.expectedRent > 0)
    .sort((firstPick, secondPick) => secondPick.metrics.roiScore - firstPick.metrics.roiScore)
    .slice(0, 3);

  if (!investmentPicks.length) return "";

  return `
    <div class="advanced-panel investment-strip mb-4">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
        <div>
          <h2 class="h5 fw-bold mb-1">Investment insight mode</h2>
          <p class="text-secondary mb-0">Estimated rent, yield, and projected value are calculated from local market signals.</p>
        </div>
        <a class="btn btn-outline-success" href="#/properties?investment=true&sortBy=match"><i class="bi bi-graph-up-arrow"></i> Investor view</a>
      </div>
      <div class="row g-3">
        ${investmentPicks.map(({ propertyListing, metrics }) => `
          <div class="col-md-4">
            <div class="investment-card">
              <div class="d-flex justify-content-between gap-2">
                <div class="fw-bold">${escapeHtml(propertyListing.title)}</div>
                <span class="status-badge signal-success">${metrics.roiScore}</span>
              </div>
              <div class="small text-secondary">${formatPrice(metrics.expectedRent)} rent / mo</div>
              <div class="mini-trend mt-3">${renderMiniTrendBars(metrics.priceHistory)}</div>
              <div class="d-flex justify-content-between small mt-2">
                <span>${metrics.grossYield}% yield</span>
                <span>${metrics.label}</span>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderLifestyleMap(propertyListings, buyerProfile) {
  const mapListings = propertyListings.slice(0, 4);
  if (!mapListings.length) return "";

  return `
    <div class="advanced-panel lifestyle-map mb-4">
      <div class="row g-3 align-items-center">
        <div class="col-lg-5">
          <h2 class="h5 fw-bold mb-1">Commute and lifestyle intelligence</h2>
          <p class="text-secondary mb-3">Illustrative layout only. Pins are not geographic locations; commute and lifestyle scores are sample estimates.</p>
          <div class="d-grid gap-2">
            ${mapListings.map((propertyListing) => {
              const insight = getPropertyInsight(propertyListing);
              const commute = insight.commuteMinutes[buyerProfile.commuteHub] || 42;
              return `<div class="map-listing-row">
                <span>${escapeHtml(propertyListing.neighborhood)}</span>
                <strong>${commute} min</strong>
                <small>${escapeHtml(propertyListing.noiseLevel || "Medium")} noise · Safety ${propertyListing.safetyScore || 74}</small>
              </div>`;
            }).join("")}
          </div>
        </div>
        <div class="col-lg-7">
          <div class="map-simulation">
            ${mapListings.map((propertyListing, index) => `
              <a class="map-pin pin-${index + 1}" href="#/properties/${propertyListing.id}" title="${escapeHtml(propertyListing.title)}">
                <i class="bi bi-house-door-fill"></i>
              </a>
            `).join("")}
            <span class="map-label office"><i class="bi bi-briefcase"></i> Office</span>
            <span class="map-label school"><i class="bi bi-mortarboard"></i> School</span>
            <span class="map-label hospital"><i class="bi bi-hospital"></i> Hospital</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPropertiesSkeleton() {
  return `
    <section class="section-block">
      <div class="container">
        <div class="skeleton-line wide mb-3"></div>
        <div class="row g-4">
          <div class="col-lg-3">
            <div class="skeleton-panel"></div>
          </div>
          <div class="col-lg-9">
            <div class="row g-4">
              ${Array.from({ length: 6 }).map(() => `
                <div class="col-md-6 col-xl-4">
                  <div class="skeleton-card">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderDetailMetric(label, metricValue) {
  return `
    <div class="col-6 col-md-3">
      <div class="stat-tile">
        <div class="small text-secondary">${label}</div>
        <div class="fw-bold">${metricValue}</div>
      </div>
    </div>
  `;
}

function renderMiniTrend(priceHistory) {
  return `<div class="mini-trend mt-3">${renderMiniTrendBars(priceHistory)}</div>`;
}

function renderMiniTrendBars(priceHistory) {
  const maxPrice = Math.max(...priceHistory);
  const minPrice = Math.min(...priceHistory);
  const spread = Math.max(maxPrice - minPrice, 1);

  return priceHistory.map((pricePoint) => {
    const height = 28 + ((pricePoint - minPrice) / spread) * 48;
    return `<span style="height:${height}px"></span>`;
  }).join("");
}

function renderPriorityOptions(selectedPriority = "balanced") {
  return [
    ["balanced", "Balanced"],
    ["commute", "Commute"],
    ["family", "Family"],
    ["investment", "Investment"]
  ].map(([priorityValue, priorityLabel]) => {
    const selected = selectedPriority === priorityValue ? "selected" : "";
    return `<option value="${priorityValue}" ${selected}>${priorityLabel}</option>`;
  }).join("");
}

function renderSavedSearchAlerts(searchAlerts) {
  if (!searchAlerts.length) {
    return `<p class="small text-secondary mb-0">No alerts yet. Apply filters and save the search.</p>`;
  }

  return `
    <div class="d-grid gap-2">
      ${searchAlerts.map((searchAlert) => `
        <div class="border rounded p-2">
          <a class="fw-semibold text-decoration-none d-block" href="#/properties?${searchAlert.querySignature}">${escapeHtml(searchAlert.label)}</a>
          <div class="d-flex justify-content-between align-items-center mt-1">
            <span class="small text-secondary">${formatDate(searchAlert.createdAt)}</span>
            <button class="btn btn-sm btn-outline-secondary" data-remove-alert="${searchAlert.id}"><i class="bi bi-x"></i></button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderInsightMetric(label, score) {
  return `
    <div class="col-md-4">
      <div class="stat-tile">
        <div class="d-flex justify-content-between mb-2">
          <span class="small text-secondary">${label}</span>
          <span class="fw-bold">${score}</span>
        </div>
        <div class="insight-meter"><span style="width: ${score}%"></span></div>
      </div>
    </div>
  `;
}

function renderNeighborhoodFact(label, insightValue) {
  return `
    <div class="col-md-6">
      <div class="stat-tile">
        <div class="small text-secondary">${label}</div>
        <div class="fw-semibold">${escapeHtml(insightValue)}</div>
      </div>
    </div>
  `;
}

function renderDecisionBreakdown(categoryScores = {}) {
  const labels = {
    price: "Price",
    location: "Location",
    commute: "Commute",
    lifestyle: "Lifestyle",
    amenities: "Amenities",
    investment: "Investment"
  };

  return `
    <div class="decision-breakdown mt-3">
      ${Object.entries(categoryScores).map(([scoreKey, scoreValue]) => `
        <div>
          <div class="d-flex justify-content-between small">
            <span>${labels[scoreKey] || scoreKey}</span>
            <strong>${scoreValue}</strong>
          </div>
          <div class="insight-meter"><span style="width:${scoreValue}%"></span></div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderRiskSignals(riskSignals) {
  if (!riskSignals.length) {
    return `<p class="small text-success mb-0"><i class="bi bi-shield-check"></i> No major risk notes found.</p>`;
  }

  return `
    <div class="d-grid gap-2">
      ${riskSignals.map((riskSignal) => `
        <div class="small text-secondary"><i class="bi bi-exclamation-triangle text-warning"></i> ${escapeHtml(riskSignal)}</div>
      `).join("")}
    </div>
  `;
}

function renderAdminStat(label, count, iconName) {
  return `
    <div class="col-md-6 col-xl-3">
      <div class="stat-tile">
        <div class="d-flex align-items-center justify-content-between">
          <span class="fw-semibold">${label}</span>
          <i class="bi ${iconName}"></i>
        </div>
        <div class="display-6 fw-bold">${count}</div>
      </div>
    </div>
  `;
}

function renderAdminRow(propertyListing) {
  const riskSignals = getRiskSignals(propertyListing);
  const marketSignal = calculateMarketSignal(propertyListing);
  const insight = getPropertyInsight(propertyListing);

  return `
    <tr>
      <td>
        <div class="fw-semibold">${escapeHtml(propertyListing.title)}</div>
        <div class="small text-secondary">${escapeHtml(propertyListing.agentName)} · ${escapeHtml(propertyListing.type)}</div>
      </td>
      <td>${escapeHtml(propertyListing.neighborhood)}, ${escapeHtml(propertyListing.location)}</td>
      <td>
        <div>${formatPrice(propertyListing.price)}</div>
        <span class="status-badge signal-${marketSignal.tone}">${marketSignal.label}</span>
      </td>
      <td>
        <div class="fw-semibold">${riskSignals.length} note${riskSignals.length === 1 ? "" : "s"}</div>
        <div class="small text-secondary">${escapeHtml(insight.documentHealth)}</div>
        <div class="small ${propertyListing.inspectionReady ? "text-success" : "text-warning"}">${propertyListing.inspectionReady ? "Inspection ready" : "Inspection pending"}</div>
      </td>
      <td>${renderStatusBadge(propertyListing)}</td>
      <td>${formatDate(propertyListing.updatedAt)}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-success" data-admin-status="approved" data-property-id="${propertyListing.id}">Approve</button>
          <button class="btn btn-outline-warning" data-admin-status="review" data-property-id="${propertyListing.id}">Review</button>
          <button class="btn btn-outline-danger" data-admin-status="rejected" data-property-id="${propertyListing.id}">Reject</button>
          <button class="btn btn-outline-secondary" data-admin-remove="${propertyListing.id}"><i class="bi bi-trash"></i></button>
        </div>
      </td>
    </tr>
  `;
}

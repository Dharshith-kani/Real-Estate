import { getCurrentUser, updateCurrentUser } from "../services/authService.js";
import { getBuyerProfile, getBuyerProfileOrDefault, getComparisonIds, saveBuyerProfile } from "../services/buyerToolsService.js";
import { getFeaturedProperties } from "../services/propertyService.js";
import { escapeHtml, renderPropertyCard, renderTypeOptions, showToast } from "../views/templates.js";
import { bindCompareActions, renderComparisonTray } from "./comparisonController.js";

export function renderHomePage(appRoot) {
  const featuredProperties = getFeaturedProperties();
  const currentUser = getCurrentUser();
  const buyerProfile = getBuyerProfile();
  const profileDraft = getBuyerProfileOrDefault();
  const compareIds = getComparisonIds();

  appRoot.innerHTML = `
    <section class="hero-section">
      <div class="container">
        <div class="hero-frame">
          <div class="hero-photo">
            <div class="hero-copy">
              <span class="eyebrow"><i class="bi bi-patch-check-fill"></i> Your next home starts here</span>
              <h1>Find a place to call your own.</h1>
              <p>Explore homes, compare your shortlist, and plan your next move with sample neighborhood and affordability insights.</p>
              <div class="hero-trust-row">
                <span class="trust-pill"><i class="bi bi-shield-check"></i> Document checks</span>
                <span class="trust-pill"><i class="bi bi-graph-up-arrow"></i> Price confidence score</span>
                <span class="trust-pill"><i class="bi bi-person-check"></i> Verified agents</span>
              </div>
            </div>
          </div>
          <form class="hero-search-panel" id="heroSearchForm">
            <div class="row g-3 align-items-end">
              <div class="col-lg-4">
                <label class="form-label" for="heroLocation">Location</label>
                <input class="form-control" id="heroLocation" name="location" placeholder="City or neighborhood">
              </div>
              <div class="col-sm-6 col-lg-3">
                <label class="form-label" for="heroBudget">Budget</label>
                <select class="form-select" id="heroBudget" name="budget">
                  <option value="">Any budget</option>
                  <option value="7500000">Under ₹75L</option>
                  <option value="12500000">Under ₹1.25Cr</option>
                  <option value="20000000">Under ₹2Cr</option>
                  <option value="35000000">Under ₹3.5Cr</option>
                </select>
              </div>
              <div class="col-sm-6 col-lg-3">
                <label class="form-label" for="heroType">Type</label>
                <select class="form-select" id="heroType" name="type">
                  ${renderTypeOptions()}
                </select>
              </div>
              <div class="col-lg-2 d-grid">
                <button class="btn btn-primary" type="submit"><i class="bi bi-search"></i> Search</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>

    <section class="section-block">
      <div class="container">
        <div class="row g-4 align-items-stretch">
          <div class="col-lg-7">
            <div class="advanced-panel h-100">
              <span class="eyebrow text-primary"><i class="bi bi-stars"></i> Smart buyer advisor</span>
              <h2 class="section-title mt-2">Personalized property matching</h2>
              <p class="section-kicker">Set a simple buyer profile and EstateLedger scores homes by fit, affordability, commute, and neighborhood signals.</p>
              <form id="buyerProfileForm" class="row g-3 mt-1">
                <div class="col-md-6">
                  <label class="form-label" for="profileLocation">Preferred location</label>
                  <input class="form-control" id="profileLocation" name="preferredLocation" value="${escapeHtml(profileDraft.preferredLocation)}" placeholder="Bengaluru, Bandra, Gachibowli">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="profileBudget">Max budget</label>
                  <input class="form-control" id="profileBudget" name="maxBudget" type="number" min="1" value="${profileDraft.maxBudget}">
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="profileBedrooms">Bedrooms</label>
                  <input class="form-control" id="profileBedrooms" name="bedrooms" type="number" min="0" value="${profileDraft.bedrooms}">
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="profileType">Type</label>
                  <select class="form-select" id="profileType" name="propertyType">${renderTypeOptions(profileDraft.propertyType)}</select>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="profilePriority">Priority</label>
                  <select class="form-select" id="profilePriority" name="priority">
                    ${renderPriorityOptions(profileDraft.priority)}
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="profileIncome">Monthly income</label>
                  <input class="form-control" id="profileIncome" name="monthlyIncome" type="number" min="1" value="${profileDraft.monthlyIncome}">
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="profileDownPayment">Down payment</label>
                  <input class="form-control" id="profileDownPayment" name="downPayment" type="number" min="0" value="${profileDraft.downPayment}">
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="profileCommute">Commute hub</label>
                  <select class="form-select" id="profileCommute" name="commuteHub">
                    ${renderCommuteOptions(profileDraft.commuteHub)}
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="profileLifestyle">Lifestyle</label>
                  <select class="form-select" id="profileLifestyle" name="lifestylePreference">
                    ${renderLifestyleOptions(profileDraft.lifestylePreference)}
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="profileFamilySize">Family size</label>
                  <input class="form-control" id="profileFamilySize" name="familySize" type="number" min="1" value="${profileDraft.familySize}">
                </div>
                <div class="col-12">
                  <button class="btn btn-success" type="submit"><i class="bi bi-magic"></i> Save profile</button>
                  ${buyerProfile ? `<span class="small text-secondary ms-2">Match scoring is active.</span>` : `<span class="small text-secondary ms-2">Uses a sensible default until you save.</span>`}
                </div>
              </form>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="advanced-panel h-100">
              <h3 class="h5 fw-bold">What is advanced here?</h3>
              <div class="row g-3 mt-1">
                ${renderAdvancedFeature("bi-bullseye", "Fit scoring", "Homes are ranked against budget, location, bedrooms, type, and buying intent.")}
                ${renderAdvancedFeature("bi-wallet2", "EMI guardrails", "Detail pages flag comfortable, stretch, and aggressive affordability zones.")}
                ${renderAdvancedFeature("bi-columns-gap", "Live comparison", "Shortlist up to three properties and compare practical decision signals.")}
                ${renderAdvancedFeature("bi-shield-lock", "Risk notes", "Admin and buyer views surface verification, inspection, and pricing risks.")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-block">
      <div class="container">
        <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-end mb-4">
          <div>
            <h2 class="section-title">Featured verified properties</h2>
            <p class="section-kicker mb-0">Fresh, reviewed listings with clear ownership signals and practical next steps for buyers.</p>
          </div>
          <a class="btn btn-outline-primary" href="#/properties">Browse all homes</a>
        </div>
        <div class="row g-4">
          ${featuredProperties.map((propertyListing) => `
            <div class="col-md-6 col-xl-4">${renderPropertyCard(propertyListing, currentUser, { buyerProfile: profileDraft, compareIds })}</div>
          `).join("")}
        </div>
        ${renderComparisonTray()}
      </div>
    </section>

    <section class="section-block info-band">
      <div class="container">
        <div class="row g-4">
          <div class="col-md-4">
            <div class="trust-card">
              <i class="bi bi-file-earmark-check"></i>
              <h3 class="h5 fw-bold mt-3">Document-led listings</h3>
              <p class="text-secondary mb-0">Every approved home shows the review status buyers usually ask agents about first.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="trust-card">
              <i class="bi bi-map"></i>
              <h3 class="h5 fw-bold mt-3">Neighborhood context</h3>
              <p class="text-secondary mb-0">City, locality, area, and price scoring stay visible so comparisons are faster.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="trust-card">
              <i class="bi bi-headset"></i>
              <h3 class="h5 fw-bold mt-3">Agent accountability</h3>
              <p class="text-secondary mb-0">Contact details are tied to the listing and can be moderated by admins.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  bindHeroSearch(appRoot);
  bindBuyerProfileForm(appRoot);
  bindSaveButtons(appRoot);
  bindCompareActions(appRoot);
}

function bindHeroSearch(appRoot) {
  appRoot.querySelector("#heroSearchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const searchForm = new FormData(event.currentTarget);
    const query = new URLSearchParams();

    for (const [fieldName, fieldValue] of searchForm.entries()) {
      if (String(fieldValue).trim()) {
        query.set(fieldName, fieldValue);
      }
    }

    location.hash = `#/properties${query.toString() ? `?${query}` : ""}`;
  });
}

function bindBuyerProfileForm(appRoot) {
  appRoot.querySelector("#buyerProfileForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      saveBuyerProfile(Object.fromEntries(new FormData(event.currentTarget)));
      showToast("Buyer profile saved. Match scores updated.", "success");
      renderHomePage(appRoot);
    } catch (error) {
      console.warn("Buyer profile save failed", error);
      showToast(error.message, "danger");
    }
  });
}

function renderPriorityOptions(selectedPriority = "balanced") {
  return [
    ["balanced", "Balanced"],
    ["commute", "Commute first"],
    ["family", "Family services"],
    ["investment", "Investment yield"]
  ].map(([priorityValue, priorityLabel]) => {
    const selected = selectedPriority === priorityValue ? "selected" : "";
    return `<option value="${priorityValue}" ${selected}>${priorityLabel}</option>`;
  }).join("");
}

function renderCommuteOptions(selectedHub = "Tech Park") {
  return ["Tech Park", "Airport", "City Center"].map((commuteHub) => {
    const selected = selectedHub === commuteHub ? "selected" : "";
    return `<option value="${commuteHub}" ${selected}>${commuteHub}</option>`;
  }).join("");
}

function renderLifestyleOptions(selectedLifestyle = "quiet") {
  return [
    ["quiet", "Quiet living"],
    ["city", "City energy"],
    ["family", "Family-first"],
    ["investment", "Investment"],
    ["balanced", "Balanced"]
  ].map(([lifestyleValue, lifestyleLabel]) => {
    const selected = selectedLifestyle === lifestyleValue ? "selected" : "";
    return `<option value="${lifestyleValue}" ${selected}>${lifestyleLabel}</option>`;
  }).join("");
}

function renderAdvancedFeature(iconName, title, text) {
  return `
    <div class="col-sm-6">
      <div class="d-flex gap-3">
        <i class="bi ${iconName} text-success fs-4"></i>
        <div>
          <div class="fw-bold">${title}</div>
          <div class="small text-secondary">${text}</div>
        </div>
      </div>
    </div>
  `;
}

export function bindSaveButtons(appRoot) {
  appRoot.querySelectorAll("[data-save-property]").forEach((saveButton) => {
    saveButton.addEventListener("click", () => {
      const currentUser = getCurrentUser();

      if (!currentUser) {
        showToast("Login to save properties.", "warning");
        location.hash = "#/login";
        return;
      }

      const propertyId = saveButton.dataset.saveProperty;
      const savedPropertyIds = new Set(currentUser.savedPropertyIds || []);
      const iconElement = saveButton.querySelector("i");

      if (savedPropertyIds.has(propertyId)) {
        savedPropertyIds.delete(propertyId);
        saveButton.classList.remove("active");
        iconElement.className = "bi bi-heart";
        showToast("Removed from saved homes.", "secondary");
      } else {
        savedPropertyIds.add(propertyId);
        saveButton.classList.add("active");
        iconElement.className = "bi bi-heart-fill";
        showToast("Saved to your shortlist.", "success");
      }

      updateCurrentUser({ ...currentUser, savedPropertyIds: [...savedPropertyIds] });
      window.dispatchEvent(new Event("hashchange"));
    });
  });
}

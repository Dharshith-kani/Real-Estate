import { getCurrentUser } from "../services/authService.js";
import { getBuyerProfileOrDefault, getComparisonIds, getRecentlyViewedIds, getSearchAlerts } from "../services/buyerToolsService.js";
import { calculateInvestmentMetrics, calculateMatchScore } from "../services/insightsService.js";
import { findPropertyById, getApprovedProperties } from "../services/propertyService.js";
import { bindCompareActions } from "./comparisonController.js";
import { bindSaveButtons } from "./homeController.js";
import { escapeHtml, formatDate, formatPrice, renderPropertyCard } from "../views/templates.js";

export function renderDashboardPage(appRoot) {
  const currentUser = getCurrentUser();
  const buyerProfile = getBuyerProfileOrDefault();
  const compareIds = getComparisonIds();
  const approvedProperties = getApprovedProperties();
  const savedProperties = (currentUser?.savedPropertyIds || [])
    .map((propertyId) => findPropertyById(propertyId))
    .filter(property => property?.status === "approved");
  const recentlyViewedProperties = getRecentlyViewedIds()
    .map((propertyId) => findPropertyById(propertyId))
    .filter(property => property?.status === "approved");
  const recommendedProperties = approvedProperties
    .map((propertyListing) => ({
      propertyListing,
      match: calculateMatchScore(propertyListing, buyerProfile)
    }))
    .sort((firstListing, secondListing) => secondListing.match.score - firstListing.match.score)
    .slice(0, 3);
  const searchAlerts = getSearchAlerts();
  const priceDropProperties = approvedProperties
    .filter((propertyListing) => Number(propertyListing.priceDroppedPercent || 0) > 0)
    .sort((firstListing, secondListing) => secondListing.priceDroppedPercent - firstListing.priceDroppedPercent)
    .slice(0, 3);
  const portfolio = buildPortfolioSnapshot(savedProperties.length ? savedProperties : recommendedProperties.map(({ propertyListing }) => propertyListing));

  appRoot.innerHTML = `
    <section class="section-block">
      <div class="container">
        <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-end mb-4">
          <div>
            <h1 class="section-title">Personalized property command center</h1>
            <p class="section-kicker mb-0">Saved homes, viewing history, recommendations, alerts, and investment signals in one workspace.</p>
          </div>
          <a class="btn btn-primary" href="#/properties?sortBy=match"><i class="bi bi-magic"></i> Continue discovery</a>
        </div>

        <div class="dashboard-hero mb-4">
          <div>
            <span class="eyebrow"><i class="bi bi-person-check"></i> Buyer intelligence</span>
            <h2>${currentUser ? `Welcome back, ${escapeHtml(currentUser.name)}` : "Build a smarter shortlist"}</h2>
            <p>EstateLedger watches saved homes, price drops, local strength, and ROI quality so buyers are not stuck comparing raw listings manually.</p>
          </div>
          <div class="portfolio-summary">
            <div class="small text-white-50">Portfolio projection</div>
            <div class="display-6 fw-bold">${formatPrice(portfolio.projectedValue)}</div>
            <div class="small">${portfolio.averageYield}% avg yield · ${portfolio.roiScore} score</div>
          </div>
        </div>

        <div class="row g-4 mb-4">
          ${renderDashboardStat("Saved homes", savedProperties.length, "bi-heart")}
          ${renderDashboardStat("Recently viewed", recentlyViewedProperties.length, "bi-clock-history")}
          ${renderDashboardStat("Smart alerts", searchAlerts.length, "bi-bell")}
          ${renderDashboardStat("Price drops", priceDropProperties.length, "bi-arrow-down-circle")}
        </div>

        <div class="row g-4">
          <div class="col-xl-8">
            <div class="advanced-panel h-100">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="h5 fw-bold mb-0">Recommended for you</h2>
                <span class="small text-secondary">Ranked by decision score</span>
              </div>
              <div class="row g-4">
                ${recommendedProperties.map(({ propertyListing }) => `
                  <div class="col-md-6 col-xxl-4">${renderPropertyCard(propertyListing, currentUser, { buyerProfile, compareIds })}</div>
                `).join("")}
              </div>
            </div>
          </div>
          <div class="col-xl-4">
            <div class="advanced-panel mb-4">
              <h2 class="h5 fw-bold">Smart alerts</h2>
              ${renderAlerts(searchAlerts)}
            </div>
            <div class="advanced-panel">
              <h2 class="h5 fw-bold">Price movement</h2>
              ${renderPriceDrops(priceDropProperties)}
            </div>
          </div>
        </div>

        <div class="row g-4 mt-1">
          <div class="col-lg-6">
            <div class="advanced-panel h-100">
              <h2 class="h5 fw-bold">Recently viewed</h2>
              ${renderCompactPropertyList(recentlyViewedProperties)}
            </div>
          </div>
          <div class="col-lg-6">
            <div class="advanced-panel h-100">
              <h2 class="h5 fw-bold">Saved shortlist</h2>
              ${renderCompactPropertyList(savedProperties)}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  bindSaveButtons(appRoot);
  bindCompareActions(appRoot);
}

function buildPortfolioSnapshot(properties) {
  if (!properties.length) {
    return { projectedValue: 0, averageYield: 0, roiScore: 0 };
  }

  const metrics = properties.map(calculateInvestmentMetrics);
  const projectedValue = metrics.reduce((total, entry) => total + entry.projectedValue, 0);
  const averageYield = metrics.reduce((total, entry) => total + entry.grossYield, 0) / metrics.length;
  const roiScore = Math.round(metrics.reduce((total, entry) => total + entry.roiScore, 0) / metrics.length);

  return {
    projectedValue,
    averageYield: Number(averageYield.toFixed(1)),
    roiScore
  };
}

function renderDashboardStat(label, count, iconName) {
  return `
    <div class="col-sm-6 col-xl-3">
      <div class="stat-tile dashboard-stat">
        <div class="d-flex justify-content-between align-items-center">
          <span>${label}</span>
          <i class="bi ${iconName}"></i>
        </div>
        <div class="display-6 fw-bold">${count}</div>
      </div>
    </div>
  `;
}

function renderAlerts(searchAlerts) {
  if (!searchAlerts.length) {
    return `<p class="text-secondary mb-0">Save filtered searches from discovery to make this dashboard useful.</p>`;
  }

  return `
    <div class="d-grid gap-2">
      ${searchAlerts.slice(0, 4).map((searchAlert) => `
        <a class="dashboard-row" href="#/properties?${searchAlert.querySignature}">
          <span>${escapeHtml(searchAlert.label)}</span>
          <small>${formatDate(searchAlert.createdAt)}</small>
        </a>
      `).join("")}
    </div>
  `;
}

function renderPriceDrops(priceDropProperties) {
  if (!priceDropProperties.length) {
    return `<p class="text-secondary mb-0">No price drops detected right now.</p>`;
  }

  return `
    <div class="d-grid gap-2">
      ${priceDropProperties.map((propertyListing) => `
        <a class="dashboard-row" href="#/properties/${propertyListing.id}">
          <span>${escapeHtml(propertyListing.title)}</span>
          <strong>${propertyListing.priceDroppedPercent}% drop</strong>
        </a>
      `).join("")}
    </div>
  `;
}

function renderCompactPropertyList(properties) {
  if (!properties.length) {
    return `<p class="text-secondary mb-0">No properties here yet.</p>`;
  }

  return `
    <div class="d-grid gap-2">
      ${properties.slice(0, 5).map((propertyListing) => `
        <a class="dashboard-row" href="#/properties/${propertyListing.id}">
          <span>${escapeHtml(propertyListing.title)}</span>
          <strong>${formatPrice(propertyListing.price)}</strong>
        </a>
      `).join("")}
    </div>
  `;
}

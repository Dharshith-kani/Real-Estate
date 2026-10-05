import { clearComparison, getBuyerProfileOrDefault, getComparisonIds, toggleCompareProperty } from "../services/buyerToolsService.js";
import { findPropertyById } from "../services/propertyService.js";
import { calculateAffordability, calculateInvestmentMetrics, calculateMarketSignal, calculateMatchScore, getPropertyInsight } from "../services/insightsService.js";
import { escapeHtml, formatPrice, showToast } from "../views/templates.js";

export function renderComparisonTray() {
  const comparedProperties = getComparisonIds()
    .map((propertyId) => findPropertyById(propertyId))
    .filter(property => property?.status === "approved");

  if (!comparedProperties.length) return "";

  return `
    <div class="compare-tray" id="comparisonTray">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center">
        <div>
          <div class="small text-white-50">Compare queue</div>
          <div class="d-flex flex-wrap gap-2 mt-1">
            ${comparedProperties.map((propertyListing) => `
              <span class="compare-chip">${escapeHtml(propertyListing.title)}</span>
            `).join("")}
          </div>
        </div>
        <div class="d-flex gap-2">
          <a class="btn btn-light btn-sm" href="#/compare"><i class="bi bi-columns-gap"></i> Compare ${comparedProperties.length}</a>
          <button class="btn btn-outline-light btn-sm" id="clearComparisonTray">Clear</button>
        </div>
      </div>
    </div>
  `;
}

export function bindCompareActions(appRoot) {
  appRoot.querySelectorAll("[data-compare-property]").forEach((compareButton) => {
    compareButton.addEventListener("click", () => {
      try {
        const result = toggleCompareProperty(compareButton.dataset.compareProperty);
        showToast(result.selected ? "Added to comparison." : "Removed from comparison.", result.selected ? "success" : "secondary");
        window.dispatchEvent(new Event("hashchange"));
      } catch (error) {
        console.warn("Comparison update failed", error);
        showToast(error.message, "warning");
      }
    });
  });

  appRoot.querySelector("#clearComparisonTray")?.addEventListener("click", () => {
    clearComparison();
    showToast("Comparison cleared.", "secondary");
    window.dispatchEvent(new Event("hashchange"));
  });
}

export function renderComparePage(appRoot) {
  const buyerProfile = getBuyerProfileOrDefault();
  const comparedProperties = getComparisonIds()
    .map((propertyId) => findPropertyById(propertyId))
    .filter(property => property?.status === "approved");

  if (!comparedProperties.length) {
    appRoot.innerHTML = `
      <section class="section-block">
        <div class="container">
          <div class="empty-state">
            <h1 class="h4 fw-bold">No homes selected for comparison</h1>
            <p class="text-secondary">Use the compare button on property cards to shortlist up to three homes.</p>
            <a class="btn btn-primary" href="#/properties">Browse properties</a>
          </div>
        </div>
      </section>
    `;
    return;
  }

  const comparisonModel = buildComparisonModel(comparedProperties, buyerProfile);

  appRoot.innerHTML = `
    <section class="section-block">
      <div class="container">
        <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-end mb-4">
          <div>
            <h1 class="section-title">Side-by-side property compare</h1>
            <p class="section-kicker mb-0">Compare price, match fit, affordability, local signals, and risk notes before opening an enquiry.</p>
          </div>
          <button class="btn btn-outline-secondary" id="clearComparePage">Clear comparison</button>
        </div>

        <div class="advanced-panel mb-4">
          <div class="row g-3">
            ${comparisonModel.summaryCards.map((summaryCard) => `
              <div class="col-md-4">
                <div class="stat-tile h-100">
                  <div class="small text-secondary">${summaryCard.label}</div>
                  <div class="fw-bold">${escapeHtml(summaryCard.title)}</div>
                  <div class="small text-secondary">${escapeHtml(summaryCard.reason)}</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="admin-panel table-responsive">
          <table class="table compare-table align-middle">
            <thead>
              <tr>
                <th>Signal</th>
                ${comparedProperties.map((propertyListing) => `<th>${escapeHtml(propertyListing.title)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${renderCompareRow("Price", comparedProperties.map((propertyListing) => formatPrice(propertyListing.price)), comparisonModel.winners.price)}
              ${renderCompareRow("Match score", comparedProperties.map((propertyListing) => {
                const match = calculateMatchScore(propertyListing, buyerProfile);
                return `${match.score}% - ${match.label}`;
              }), comparisonModel.winners.match)}
              ${renderCompareRow("EMI health", comparedProperties.map((propertyListing) => {
                const affordability = calculateAffordability(propertyListing, buyerProfile);
                return `${formatPrice(affordability.emi)} / mo (${affordability.label})`;
              }), comparisonModel.winners.emi)}
              ${renderCompareRow("Market price", comparedProperties.map((propertyListing) => {
                const marketSignal = calculateMarketSignal(propertyListing);
                return `${marketSignal.label}, ${Math.round(marketSignal.delta)}% vs benchmark`;
              }), comparisonModel.winners.market)}
              ${renderCompareRow("Neighborhood", comparedProperties.map((propertyListing) => {
                const insight = getPropertyInsight(propertyListing);
                return `Transit ${insight.transitScore}, School ${insight.schoolScore}, Demand ${insight.rentalDemand}`;
              }), comparisonModel.winners.neighborhood)}
              ${renderCompareRow("Investment", comparedProperties.map((propertyListing) => {
                const metrics = calculateInvestmentMetrics(propertyListing);
                return `${metrics.roiScore} ROI score, ${metrics.grossYield}% yield`;
              }), comparisonModel.winners.investment)}
              ${renderCompareRow("Area", comparedProperties.map((propertyListing) => `${propertyListing.areaSqft.toLocaleString("en-IN")} sqft`), comparisonModel.winners.area)}
              ${renderCompareRow("Agent", comparedProperties.map((propertyListing) => `${propertyListing.agentName} / ${propertyListing.agentPhone}`))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;

  appRoot.querySelector("#clearComparePage")?.addEventListener("click", () => {
    clearComparison();
    showToast("Comparison cleared.", "secondary");
    location.hash = "#/properties";
  });
}

function renderCompareRow(label, values, winnerIndex = -1) {
  return `
    <tr>
      <th>${label}</th>
      ${values.map((cellValue, index) => `
        <td class="${index === winnerIndex ? "compare-winner" : ""}">
          ${escapeHtml(cellValue)}
          ${index === winnerIndex ? `<span class="winner-label">Winner</span>` : ""}
        </td>
      `).join("")}
    </tr>
  `;
}

function buildComparisonModel(comparedProperties, buyerProfile) {
  const matchScores = comparedProperties.map((propertyListing) => calculateMatchScore(propertyListing, buyerProfile).score);
  const affordability = comparedProperties.map((propertyListing) => calculateAffordability(propertyListing, buyerProfile));
  const marketSignals = comparedProperties.map(calculateMarketSignal);
  const neighborhoodScores = comparedProperties.map((propertyListing) => {
    const insight = getPropertyInsight(propertyListing);
    return Math.round((insight.transitScore + insight.schoolScore + insight.healthcareScore) / 3);
  });
  const investmentScores = comparedProperties.map((propertyListing) => calculateInvestmentMetrics(propertyListing).roiScore);

  const winners = {
    price: indexOfMin(comparedProperties.map((propertyListing) => propertyListing.price)),
    match: indexOfMax(matchScores),
    emi: indexOfMin(affordability.map((entry) => entry.emi || Number.MAX_SAFE_INTEGER)),
    market: indexOfMin(marketSignals.map((signal) => Math.abs(signal.delta))),
    neighborhood: indexOfMax(neighborhoodScores),
    investment: indexOfMax(investmentScores),
    area: indexOfMax(comparedProperties.map((propertyListing) => propertyListing.areaSqft))
  };

  return {
    winners,
    summaryCards: [
      {
        label: "Best overall",
        title: comparedProperties[winners.match].title,
        reason: `${matchScores[winners.match]}% buyer match with the strongest decision score.`
      },
      {
        label: "Best investment",
        title: comparedProperties[winners.investment].title,
        reason: `${investmentScores[winners.investment]} ROI score with stronger rent and trend signals.`
      },
      {
        label: "Best family fit",
        title: comparedProperties[winners.neighborhood].title,
        reason: `${neighborhoodScores[winners.neighborhood]}/100 neighborhood quality across transit, schools, and healthcare.`
      }
    ]
  };
}

function indexOfMax(values) {
  return values.reduce((bestIndex, currentValue, currentIndex) => currentValue > values[bestIndex] ? currentIndex : bestIndex, 0);
}

function indexOfMin(values) {
  return values.reduce((bestIndex, currentValue, currentIndex) => currentValue < values[bestIndex] ? currentIndex : bestIndex, 0);
}

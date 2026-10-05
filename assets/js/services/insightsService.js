const neighborhoodInsightProfiles = {
  "oakridge-sky-villa": {
    transitScore: 88,
    schoolScore: 91,
    healthcareScore: 84,
    rentalDemand: "High",
    priceTrend: "+8.2% YoY",
    resaleLiquidity: "High",
    benchmarkPricePerSqft: 6200,
    expectedRent: 112000,
    commuteMinutes: {
      "Tech Park": 18,
      Airport: 54,
      "City Center": 42
    },
    documentHealth: "Title deed, EC, and tax receipts reviewed",
    riskNotes: []
  },
  "marina-courtyard-residence": {
    transitScore: 82,
    schoolScore: 89,
    healthcareScore: 93,
    rentalDemand: "Very high",
    priceTrend: "+6.6% YoY",
    resaleLiquidity: "Very high",
    benchmarkPricePerSqft: 17000,
    expectedRent: 210000,
    commuteMinutes: {
      "Tech Park": 36,
      Airport: 24,
      "City Center": 28
    },
    documentHealth: "Society NOC and tax receipts reviewed",
    riskNotes: ["Premium micro-market pricing"]
  },
  "ecr-beach-house": {
    transitScore: 72,
    schoolScore: 81,
    healthcareScore: 76,
    rentalDemand: "Medium",
    priceTrend: "+5.4% YoY",
    resaleLiquidity: "Medium",
    benchmarkPricePerSqft: 7900,
    expectedRent: 128000,
    commuteMinutes: {
      "Tech Park": 42,
      Airport: 46,
      "City Center": 50
    },
    documentHealth: "Title paperwork checked, coastal-zone review advised",
    riskNotes: ["Coastal maintenance cost can vary"]
  },
  "cyber-heights-studio": {
    transitScore: 86,
    schoolScore: 68,
    healthcareScore: 80,
    rentalDemand: "High",
    priceTrend: "+7.1% YoY",
    resaleLiquidity: "High",
    benchmarkPricePerSqft: 10800,
    expectedRent: 42000,
    commuteMinutes: {
      "Tech Park": 12,
      Airport: 38,
      "City Center": 34
    },
    documentHealth: "Builder handover packet reviewed",
    riskNotes: ["Compact resale audience"]
  },
  "greenfield-plot-42": {
    transitScore: 64,
    schoolScore: 72,
    healthcareScore: 69,
    rentalDemand: "Low",
    priceTrend: "+9.8% YoY",
    resaleLiquidity: "Medium",
    benchmarkPricePerSqft: 3600,
    expectedRent: 0,
    commuteMinutes: {
      "Tech Park": 28,
      Airport: 58,
      "City Center": 46
    },
    documentHealth: "Zoning and road-access review pending",
    riskNotes: ["Document review pending"]
  }
};

export function getPropertyInsight(propertyListing) {
  const fallbackBenchmark = Math.max(Math.round((propertyListing.price / propertyListing.areaSqft) * 0.96), 1);

  return neighborhoodInsightProfiles[propertyListing.id] || {
    transitScore: propertyListing.location ? 74 : 62,
    schoolScore: propertyListing.bedrooms >= 3 ? 78 : 68,
    healthcareScore: 72,
    rentalDemand: propertyListing.type === "Plot" ? "Low" : "Medium",
    priceTrend: "+4.8% YoY",
    resaleLiquidity: propertyListing.verified ? "Medium" : "Unknown",
    benchmarkPricePerSqft: fallbackBenchmark,
    expectedRent: propertyListing.expectedRent ?? (propertyListing.type === "Plot" ? 0 : Math.round(propertyListing.price * 0.0038)),
    commuteMinutes: {
      "Tech Park": 35,
      Airport: 48,
      "City Center": 32
    },
    documentHealth: propertyListing.documentStatus || "Documents pending review",
    riskNotes: propertyListing.verified ? [] : ["Verification still pending"]
  };
}

export function calculateDecisionScore(propertyListing, buyerProfile) {
  if (!buyerProfile) return null;

  const insight = getPropertyInsight(propertyListing);
  const maxBudget = Number(buyerProfile.maxBudget || 0);
  const familySize = Number(buyerProfile.familySize || buyerProfile.bedrooms || 1);
  const preferredLocation = String(buyerProfile.preferredLocation || "").toLowerCase();
  const lifestylePreference = String(buyerProfile.lifestylePreference || buyerProfile.priority || "balanced").toLowerCase();
  const commuteMinutes = insight.commuteMinutes[buyerProfile.commuteHub] || 42;
  const amenities = propertyListing.amenities || [];
  const lifestyleTags = propertyListing.lifestyleTags || [];
  const visualTags = propertyListing.visualTags || [];
  const rentalYield = calculateInvestmentMetrics(propertyListing).grossYield;

  const priceScore = maxBudget ? Math.max(0, Math.min(100, 100 - Math.max((propertyListing.price - maxBudget) / maxBudget * 120, 0))) : 68;
  const locationScore = preferredLocation && `${propertyListing.location} ${propertyListing.neighborhood}`.toLowerCase().includes(preferredLocation) ? 96 : 70;
  const commuteScore = Math.max(30, Math.min(100, 115 - commuteMinutes * 1.8));
  const familyFit = propertyListing.bedrooms >= Math.max(Math.ceil(familySize / 2), 1) ? 88 : 58;
  const lifestyleScore = lifestyleTags.includes(lifestylePreference) || visualTags.includes(lifestylePreference) ? 95 : lifestylePreference === "balanced" ? 78 : 62;
  const amenityScore = Math.min(96, 56 + amenities.length * 9 + (propertyListing.inspectionReady ? 8 : 0));
  const investmentScore = Math.min(98, 52 + rentalYield * 8 + (/high/i.test(insight.rentalDemand) ? 14 : 2));

  const categoryScores = {
    price: Math.round(priceScore),
    location: Math.round(locationScore),
    commute: Math.round(commuteScore),
    lifestyle: Math.round((lifestyleScore + familyFit) / 2),
    amenities: Math.round(amenityScore),
    investment: Math.round(investmentScore)
  };

  const weights = buyerProfile.priority === "investment"
    ? { price: .18, location: .14, commute: .08, lifestyle: .10, amenities: .14, investment: .36 }
    : buyerProfile.priority === "commute"
      ? { price: .20, location: .17, commute: .28, lifestyle: .13, amenities: .12, investment: .10 }
      : buyerProfile.priority === "family"
        ? { price: .18, location: .18, commute: .12, lifestyle: .26, amenities: .18, investment: .08 }
        : { price: .22, location: .18, commute: .16, lifestyle: .18, amenities: .14, investment: .12 };

  const weightedScore = Object.entries(categoryScores).reduce((total, [scoreKey, scoreValue]) => {
    return total + scoreValue * weights[scoreKey];
  }, 0);
  const clampedScore = Math.max(12, Math.min(99, Math.round(weightedScore + (propertyListing.score - 80) / 7)));

  return {
    score: clampedScore,
    label: clampedScore >= 85 ? "Excellent match" : clampedScore >= 70 ? "Strong match" : clampedScore >= 55 ? "Possible fit" : "Low fit",
    reasons: buildScoreReasons(categoryScores, propertyListing, insight, commuteMinutes),
    categoryScores,
    commuteMinutes,
    weights
  };
}

export function calculateMatchScore(propertyListing, buyerProfile) {
  return calculateDecisionScore(propertyListing, buyerProfile);
}

export function calculateMarketSignal(propertyListing) {
  const insight = getPropertyInsight(propertyListing);
  const pricePerSqft = propertyListing.price / propertyListing.areaSqft;
  const delta = ((pricePerSqft - insight.benchmarkPricePerSqft) / insight.benchmarkPricePerSqft) * 100;

  if (delta <= -6) {
    return { label: "Below local benchmark", tone: "success", delta, pricePerSqft };
  }

  if (delta <= 8) {
    return { label: "Fair price band", tone: "primary", delta, pricePerSqft };
  }

  if (delta <= 18) {
    return { label: "Premium ask", tone: "warning", delta, pricePerSqft };
  }

  return { label: "Needs price review", tone: "danger", delta, pricePerSqft };
}

export function calculateAffordability(propertyListing, buyerProfile) {
  const monthlyIncome = Number(buyerProfile?.monthlyIncome || 0);
  const downPayment = Number(buyerProfile?.downPayment || 0);
  const loanAmount = Math.max(propertyListing.price - downPayment, 0);
  const monthlyRate = 8.6 / 12 / 100;
  const tenureMonths = 20 * 12;
  const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  const incomeShare = monthlyIncome ? emi / monthlyIncome * 100 : 0;

  let label = "Add income profile";
  let tone = "secondary";

  if (monthlyIncome && incomeShare <= 35) {
    label = "Comfortable EMI";
    tone = "success";
  } else if (monthlyIncome && incomeShare <= 50) {
    label = "Stretch zone";
    tone = "warning";
  } else if (monthlyIncome) {
    label = "Aggressive EMI";
    tone = "danger";
  }

  return {
    emi: Math.round(emi || 0),
    incomeShare: Math.round(incomeShare),
    label,
    tone
  };
}

export function calculateInvestmentMetrics(propertyListing) {
  const insight = getPropertyInsight(propertyListing);
  const expectedRent = Number(propertyListing.expectedRent ?? insight.expectedRent ?? 0);
  const grossYield = propertyListing.price ? expectedRent * 12 / propertyListing.price * 100 : 0;
  const trendNumber = Number(String(insight.priceTrend).replace(/[^\d.-]/g, "")) || 0;
  const priceHistory = propertyListing.priceHistory?.length ? propertyListing.priceHistory : [propertyListing.price];
  const projectedValue = Math.round(propertyListing.price * (1 + (trendNumber / 100) * 1.6));
  const roiScore = Math.min(99, Math.round(48 + grossYield * 8 + trendNumber * 2 + (/high/i.test(insight.rentalDemand) ? 10 : 0)));

  return {
    expectedRent,
    grossYield: Number(grossYield.toFixed(1)),
    projectedValue,
    priceHistory,
    roiScore,
    label: roiScore >= 80 ? "Strong investment" : roiScore >= 65 ? "Good investment" : roiScore >= 50 ? "Stable hold" : "Lifestyle-first"
  };
}

export function getRiskSignals(propertyListing) {
  const insight = getPropertyInsight(propertyListing);
  const marketSignal = calculateMarketSignal(propertyListing);
  const daysSinceUpdate = Math.floor((Date.now() - new Date(propertyListing.updatedAt).getTime()) / 86400000);
  const riskSignals = [...insight.riskNotes];

  if (!propertyListing.verified) riskSignals.push("Verification incomplete");
  if (!propertyListing.inspectionReady) riskSignals.push("Inspection not ready");
  if (marketSignal.tone === "danger") riskSignals.push("Price is far above benchmark");
  if (daysSinceUpdate > 30) riskSignals.push("Listing has not been refreshed recently");

  return riskSignals.slice(0, 4);
}

function buildScoreReasons(categoryScores, propertyListing, insight, commuteMinutes) {
  const rankedCategories = Object.entries(categoryScores)
    .sort((firstCategory, secondCategory) => secondCategory[1] - firstCategory[1])
    .slice(0, 3)
    .map(([categoryName]) => categoryName);
  const reasonLookup = {
    price: "price fit",
    location: "location fit",
    commute: `${Math.round(commuteMinutes)} min commute`,
    lifestyle: `${propertyListing.noiseLevel || "Medium"} noise lifestyle`,
    amenities: `${(propertyListing.amenities || []).length} amenities`,
    investment: `${insight.rentalDemand} rental demand`
  };

  return rankedCategories.map((categoryName) => reasonLookup[categoryName]);
}

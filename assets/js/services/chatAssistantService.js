import { getBuyerProfileOrDefault, getComparisonIds } from "./buyerToolsService.js";
import { calculateAffordability, calculateMarketSignal, calculateMatchScore, getPropertyInsight, getRiskSignals } from "./insightsService.js";
import { findPropertyById, getApprovedProperties } from "./propertyService.js";
import { readCollection, STORAGE_KEYS, writeCollection } from "./storageService.js";

const quickPromptLabels = [
  "Show 2BHK under 50L in Chennai",
  "Best homes for me",
  "Modern quiet homes",
  "Can I afford this?",
  "Compare selected homes",
  "Show low-risk listings"
];

export function getQuickPromptLabels() {
  return quickPromptLabels;
}

export function getChatHistory() {
  return readCollection(STORAGE_KEYS.aiChatHistory).slice(-12);
}

export function clearChatHistory() {
  writeCollection(STORAGE_KEYS.aiChatHistory, []);
}

export function askPropertyAssistant(userMessage) {
  const cleanMessage = String(userMessage || "").trim();
  if (!cleanMessage) {
    throw new Error("Ask a property question first.");
  }

  const reply = buildAssistantReply(cleanMessage);
  const nextHistory = [
    ...getChatHistory(),
    { role: "user", text: cleanMessage, createdAt: new Date().toISOString() },
    { role: "assistant", text: reply.text, links: reply.links || [], createdAt: new Date().toISOString() }
  ].slice(-12);

  writeCollection(STORAGE_KEYS.aiChatHistory, nextHistory);
  return reply;
}

function buildAssistantReply(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  const approvedProperties = getApprovedProperties();

  if (!approvedProperties.length) {
    return {
      text: "I do not see any approved listings yet. Add or approve a property from the admin dashboard first.",
      links: [{ label: "Open admin", href: "#/admin" }]
    };
  }

  const filterCommand = parseUiFilterCommand(lowerMessage, approvedProperties);
  if (filterCommand) {
    return filterCommand;
  }

  if (hasAny(lowerMessage, ["compare", "comparison", "side by side"])) {
    return answerComparisonQuestion();
  }

  if (hasAny(lowerMessage, ["afford", "emi", "loan", "income", "payment", "budget"])) {
    return answerAffordabilityQuestion(lowerMessage, approvedProperties);
  }

  if (hasAny(lowerMessage, ["risk", "safe", "trust", "verified", "document", "inspection"])) {
    return answerRiskQuestion(approvedProperties);
  }

  if (hasAny(lowerMessage, ["school", "transit", "hospital", "health", "neighborhood", "commute", "rental", "resale"])) {
    return answerNeighborhoodQuestion(lowerMessage, approvedProperties);
  }

  if (hasAny(lowerMessage, ["sell", "list my", "create listing", "post property"])) {
    return {
      text: "Yes. Use the seller form to submit property details, document status, inspection readiness, agent info, and photos. New listings go to admin review before buyers see them.",
      links: [{ label: "List property", href: "#/sell" }, { label: "Admin review", href: "#/admin" }]
    };
  }

  if (hasAny(lowerMessage, ["login", "signup", "account", "admin"])) {
    return {
      text: "You can sign up as a buyer, or use the demo admin account to moderate listings. Admin login is admin@estateledger.test with password admin123.",
      links: [{ label: "Login", href: "#/login" }, { label: "Sign up", href: "#/signup" }]
    };
  }

  return answerRecommendationQuestion(lowerMessage, approvedProperties);
}

function parseUiFilterCommand(lowerMessage, approvedProperties) {
  const looksLikeUiCommand = hasAny(lowerMessage, ["show", "find", "filter", "search", "open", "display"]);
  const extractedFilters = {};
  const knownLocations = [...new Set(approvedProperties.flatMap((propertyListing) => [
    propertyListing.location,
    propertyListing.neighborhood
  ]))];

  const matchedLocation = knownLocations.find((locationName) => lowerMessage.includes(locationName.toLowerCase()));
  if (matchedLocation) extractedFilters.location = matchedLocation;

  const bedroomMatch = lowerMessage.match(/(\d+)\s*(bhk|bed|bedroom|bedrooms)/);
  if (bedroomMatch) extractedFilters.bedrooms = bedroomMatch[1];

  const budget = extractBudget(lowerMessage);
  if (budget) extractedFilters.budget = String(budget);

  const propertyTypeMap = [
    ["villa", "Villa"],
    ["apartment", "Apartment"],
    ["flat", "Apartment"],
    ["studio", "Studio"],
    ["plot", "Plot"],
    ["land", "Plot"],
    ["house", "Independent House"]
  ];
  const matchedType = propertyTypeMap.find(([typeKeyword]) => lowerMessage.includes(typeKeyword));
  if (matchedType) extractedFilters.type = matchedType[1];

  const visualStyles = ["modern", "luxury", "minimal", "eco", "city", "coastal"];
  const matchedStyle = visualStyles.find((styleName) => lowerMessage.includes(styleName));
  if (matchedStyle) extractedFilters.style = matchedStyle;

  const lifestyles = ["quiet", "family", "commute", "investment", "city"];
  const matchedLifestyle = lifestyles.find((lifestyleName) => lowerMessage.includes(lifestyleName));
  if (matchedLifestyle) extractedFilters.lifestyle = matchedLifestyle;

  if (!looksLikeUiCommand && Object.keys(extractedFilters).length < 2) return null;
  if (!Object.keys(extractedFilters).length) return null;

  const query = new URLSearchParams({ ...extractedFilters, sortBy: "match" });
  const readableFilters = Object.entries(extractedFilters)
    .map(([filterKey, filterValue]) => `${filterKey}: ${filterValue}`)
    .join(", ");

  return {
    text: `I applied these discovery filters: ${readableFilters}. The listing grid is now ranked by smart match, so the strongest options should appear first.`,
    links: [{ label: "View filtered listings", href: `#/properties?${query}` }],
    action: { type: "navigate", href: `#/properties?${query}` }
  };
}

function answerRecommendationQuestion(lowerMessage, approvedProperties) {
  const matchedByText = findListingsMentionedInMessage(lowerMessage, approvedProperties);
  const buyerProfile = getBuyerProfileOrDefault();
  const candidateProperties = matchedByText.length ? matchedByText : approvedProperties;
  const rankedProperties = rankPropertiesForBuyer(candidateProperties, buyerProfile).slice(0, 3);

  const topLines = rankedProperties.map(({ propertyListing, matchResult }, index) => {
    const marketSignal = calculateMarketSignal(propertyListing);
    return `${index + 1}. ${propertyListing.title} in ${propertyListing.neighborhood}, ${propertyListing.location} - ${matchResult.score}% match, ${formatMoney(propertyListing.price)}, ${marketSignal.label}.`;
  });

  return {
    text: `My best picks are:\n${topLines.join("\n")}\n\nI ranked these using your saved buyer profile, budget fit, verification score, price signal, and local demand.`,
    links: [
      { label: "Open listings", href: "#/properties?sortBy=match" },
      ...rankedProperties.slice(0, 1).map(({ propertyListing }) => ({ label: "View top pick", href: `#/properties/${propertyListing.id}` }))
    ]
  };
}

function answerAffordabilityQuestion(lowerMessage, approvedProperties) {
  const buyerProfile = getBuyerProfileOrDefault();
  const mentionedListings = findListingsMentionedInMessage(lowerMessage, approvedProperties);
  const propertyListing = mentionedListings[0] || rankPropertiesForBuyer(approvedProperties, buyerProfile)[0].propertyListing;
  const affordability = calculateAffordability(propertyListing, buyerProfile);
  const marketSignal = calculateMarketSignal(propertyListing);

  return {
    text: `${propertyListing.title} has an estimated EMI of ${formatMoney(affordability.emi)} per month. That is about ${affordability.incomeShare}% of the monthly income in your buyer profile, so I would call it: ${affordability.label}. The current price signal is ${marketSignal.label}.`,
    links: [
      { label: "View property", href: `#/properties/${propertyListing.id}` },
      { label: "Edit buyer profile", href: "#/" }
    ]
  };
}

function answerComparisonQuestion() {
  const buyerProfile = getBuyerProfileOrDefault();
  const comparedProperties = getComparisonIds()
    .map((propertyId) => findPropertyById(propertyId))
    .filter(Boolean);

  if (!comparedProperties.length) {
    return {
      text: "No homes are selected for comparison yet. Tap the compare icon on up to three property cards, then I can compare price, EMI, match score, market signal, and local quality.",
      links: [{ label: "Browse homes", href: "#/properties" }]
    };
  }

  const summaryLines = comparedProperties.map((propertyListing) => {
    const matchResult = calculateMatchScore(propertyListing, buyerProfile);
    const affordability = calculateAffordability(propertyListing, buyerProfile);
    return `${propertyListing.title}: ${matchResult.score}% match, ${formatMoney(propertyListing.price)}, EMI ${formatMoney(affordability.emi)} (${affordability.label}).`;
  });

  return {
    text: `Here is the quick comparison:\n${summaryLines.join("\n")}`,
    links: [{ label: "Open comparison", href: "#/compare" }]
  };
}

function answerRiskQuestion(approvedProperties) {
  const saferProperties = approvedProperties
    .map((propertyListing) => ({
      propertyListing,
      riskSignals: getRiskSignals(propertyListing),
      marketSignal: calculateMarketSignal(propertyListing)
    }))
    .sort((firstListing, secondListing) => firstListing.riskSignals.length - secondListing.riskSignals.length)
    .slice(0, 3);

  const lines = saferProperties.map(({ propertyListing, riskSignals, marketSignal }) => {
    const riskText = riskSignals.length ? `${riskSignals.length} risk note(s)` : "no major risk notes";
    return `${propertyListing.title}: ${riskText}, ${marketSignal.label}, ${propertyListing.inspectionReady ? "inspection ready" : "inspection pending"}.`;
  });

  return {
    text: `The lower-risk options right now are:\n${lines.join("\n")}`,
    links: [{ label: "View verified homes", href: "#/properties?sortBy=match" }]
  };
}

function answerNeighborhoodQuestion(lowerMessage, approvedProperties) {
  const matchedListings = findListingsMentionedInMessage(lowerMessage, approvedProperties);
  const propertyListing = matchedListings[0] || rankPropertiesForBuyer(approvedProperties, getBuyerProfileOrDefault())[0].propertyListing;
  const insight = getPropertyInsight(propertyListing);

  return {
    text: `${propertyListing.title} has transit ${insight.transitScore}/100, schools ${insight.schoolScore}/100, healthcare ${insight.healthcareScore}/100, rental demand ${insight.rentalDemand}, and resale liquidity ${insight.resaleLiquidity}. The local trend is ${insight.priceTrend}.`,
    links: [{ label: "View details", href: `#/properties/${propertyListing.id}` }]
  };
}

function rankPropertiesForBuyer(propertyListings, buyerProfile) {
  return propertyListings
    .map((propertyListing) => ({
      propertyListing,
      matchResult: calculateMatchScore(propertyListing, buyerProfile)
    }))
    .sort((firstListing, secondListing) => secondListing.matchResult.score - firstListing.matchResult.score);
}

function findListingsMentionedInMessage(lowerMessage, propertyListings) {
  return propertyListings.filter((propertyListing) => {
    const searchableText = `${propertyListing.title} ${propertyListing.location} ${propertyListing.neighborhood} ${propertyListing.type}`.toLowerCase();
    return searchableText.split(/\s+/).some((word) => word.length > 3 && lowerMessage.includes(word));
  });
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function extractBudget(lowerMessage) {
  const budgetMatch = lowerMessage.match(/(?:under|below|less than|upto|up to)\s*(?:₹|rs\.?|inr)?\s*([\d.]+)\s*(cr|crore|crores|l|lac|lakh|lakhs)?/);
  if (!budgetMatch) return null;

  const rawAmount = Number(budgetMatch[1]);
  const unit = budgetMatch[2] || "";

  if (!rawAmount) return null;
  if (["cr", "crore", "crores"].includes(unit)) return Math.round(rawAmount * 10000000);
  if (["l", "lac", "lakh", "lakhs"].includes(unit)) return Math.round(rawAmount * 100000);

  return rawAmount > 100000 ? Math.round(rawAmount) : Math.round(rawAmount * 100000);
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

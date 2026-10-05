import test from "node:test";
import assert from "node:assert/strict";
const data = new Map();
globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
const storage = await import("../assets/js/services/storageService.js");
const auth = await import("../assets/js/services/authService.js");
const properties = await import("../assets/js/services/propertyService.js");
const buyer = await import("../assets/js/services/buyerToolsService.js");
const leads = await import("../assets/js/services/enquiryService.js");
const insights = await import("../assets/js/services/insightsService.js");
function reset() { data.clear(); storage.seedInitialRecords(); }
const form = {title: 'Lakeview Home', location: 'Chennai', neighborhood: 'Anna Nagar', price: 5000000, type: 'Apartment', bedrooms: 2, bathrooms: 2, areaSqft: 1200, agentName: 'Seller', agentPhone: '+91 9876543210', description: 'A family home', expectedRent: 0};
test('seed and malformed collection recovery', () => {
  reset(); assert.equal(properties.getApprovedProperties().length, 5);
  storage.seedInitialRecords(); assert.equal(properties.getAllProperties().length, 5);
  localStorage.setItem(storage.STORAGE_KEYS.comparison, '{}'); assert.deepEqual(buyer.getComparisonIds(), []);
});
test('an empty property collection stays empty after reload', () => {
  reset(); storage.writeCollection(storage.STORAGE_KEYS.properties, []); storage.seedInitialRecords();
  assert.deepEqual(properties.getAllProperties(), []);
});
test('signup, login and duplicate email validation', () => {
  reset(); auth.signup({name:'Buyer',email:'buyer@test.com',password:'secret1'});
  assert.equal(auth.getCurrentUser().email, 'buyer@test.com');
  assert.throws(() => auth.signup({name:'Again',email:'BUYER@test.com',password:'secret1'}));
  auth.logout(); assert.equal(auth.getCurrentUser(), null);
  assert.throws(() => auth.login('buyer@test.com', 'wrong'));
  auth.login('buyer@test.com', 'secret1');
});
test('filters, sorting and comparison limit', () => {
  reset(); assert.equal(properties.searchProperties({location:'Gachibowli',budget:7500000}).length, 1);
  assert.equal(properties.searchProperties({location:'Nowhere'}).length, 0);
  const sorted=properties.searchProperties({sortBy:'price-low'}); assert.ok(sorted[0].price <= sorted[1].price);
  sorted.slice(0,3).forEach(home => buyer.toggleCompareProperty(home.id));
  assert.throws(() => buyer.toggleCompareProperty(sorted[3].id));
  buyer.toggleCompareProperty(sorted[0].id); assert.equal(buyer.getComparisonIds().length,2);
});
test('seller submits listing, admin approves, enquiry persists and seller can close it', () => {
  reset(); auth.signup({name:'Seller',email:'seller@test.com',password:'secret1'});
  const listing=properties.createListing({...form}, 'seller@test.com');
  assert.equal(listing.status, 'review'); assert.equal(listing.imageUrl, './assets/images/land2.jpg');
  assert.throws(() => properties.updatePropertyStatus(listing.id,'approved'));
  auth.login('admin@estateledger.test','admin123'); properties.updatePropertyStatus(listing.id,'approved');
  const enquiry=leads.createEnquiry(listing.id,{name:'Buyer',phone:'9876543210',message:'Please call me'});
  auth.login('seller@test.com','secret1'); assert.equal(leads.getSellerEnquiries()[0].id, enquiry.id);
  leads.updateEnquiryStatus(enquiry.id,'closed'); assert.equal(leads.getSellerEnquiries()[0].status,'closed');
  buyer.toggleCompareProperty(listing.id); properties.removeProperty(listing.id);
  assert.equal(properties.findPropertyById(listing.id),null); assert.deepEqual(buyer.getComparisonIds(), []);
});
test('invalid numbers and injected image URLs rejected', () => {
  reset(); auth.signup({name:'Seller',email:'seller@test.com',password:'secret1'});
  for (const change of [{price:'abc'},{price:Infinity},{bedrooms:-1},{areaSqft:0},{imageUrl:'x" onerror="alert(1)'},{safetyScore:200}]) {
    assert.throws(() => properties.createListing({...form,...change},'seller@test.com'));
  }
});
test('zero bedrooms and zero rent preserved, alerts deduplicated', () => {
  reset(); const profile=buyer.saveBuyerProfile({maxBudget:10000000,monthlyIncome:100000,bedrooms:0,downPayment:0});
  assert.equal(profile.bedrooms,0); assert.throws(() => buyer.saveBuyerProfile({maxBudget:'abc'}));
  buyer.saveSearchAlert({location:'Chennai'}); buyer.saveSearchAlert({location:'Chennai'}); assert.equal(buyer.getSearchAlerts().length,1);
  assert.equal(insights.calculateInvestmentMetrics({...properties.getApprovedProperties()[0],expectedRent:0}).grossYield,0);
  assert.throws(() => leads.createEnquiry('oakridge-sky-villa',{name:'Buyer',phone:'9876543210',visitDate:'2020-01-01'}));
});

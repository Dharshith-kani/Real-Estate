# Fixes and validation

## Fixed behavior

- Callback and visit requests now persist in a local enquiry inbox instead of only showing a success toast.
- Sellers land in My listings after submission, where they can see moderation status, remove their own properties, and manage enquiries. Admins can view all listings and enquiries.
- Pending listing renders no longer overwrite another route after quick navigation.
- User names and image attributes are escaped before rendering; unsafe submitted image URL schemes are rejected.
- Listing creation validates finite positive prices and areas, valid types, phone numbers, nonnegative counts and rent, and scores within range.
- Service methods check the current demo user before creating, moderating, deleting, or changing enquiry records.
- Zero-bedroom buyer profiles and zero expected rent are retained correctly.
- Rental-demand calculations recognize both High and Very high.
- Malformed non-array storage collections fall back safely to empty arrays.
- Seed updates retain prior moderation decisions, and intentionally emptied property collections stay empty after reload.
- Deleting a listing removes stale saved-home, comparison, and viewing-history references.
- Unapproved listings no longer appear in saved-home or comparison views.
- Saving or unsaving homes refreshes repeated controls and dashboard totals.
- Logout refreshes the homepage even when already on that route.
- Search budget values extracted by the assistant appear in the filter selector.
- Images have a nonrecursive fallback; bundled large images were resized and compressed.
- Bootstrap, JavaScript, icons, and fonts are served locally, avoiding a CDN requirement.
- Mobile navigation collapses after choosing a page; added keyboard focus and reduced-motion support.
- Local server handles malformed URLs and checks path boundaries correctly.
- A visible demo notice explains sample data; maps and the rule-based assistant are labeled accurately.

## Checks performed

- **7/7 service regression tests passed** with Node's built-in test runner.
- **19 JavaScript modules passed** syntax and relative import checks.
- Chromium browser checks passed for Home, discovery, detail, Dashboard, Compare, listing submission, seller workspace, Admin, Login, Sign up, and unknown routes.
- Browser checks passed for signup, seller submission, admin approval, callback creation, enquiry status changes and reload persistence, comparison, rapid route switching, search, saved searches, saved homes, escaped account names, and assistant-driven filters.
- UI dependencies loaded with external requests blocked.
- At 390px viewport width, Home, discovery, detail, seller workspace, Dashboard, and Compare showed no horizontal page overflow. Mobile menu navigation worked.
- No uncaught browser JavaScript errors were observed in those checks.
- Desktop and mobile home screenshots are included in this folder.

## Remaining production work

This remains a browser-only portfolio application. Client-side role checks and localStorage are demo conveniences, not a security boundary. Real multiuser operation requires a backend/database, server-side permissions, securely hashed passwords, uploads, notification delivery, and reliable map and property data. No agent is contacted by this demo, and no real-world document verification or investment recommendation is performed.

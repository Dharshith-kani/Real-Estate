# EstateLedger — Real Estate Platform

A complete browser-based portfolio demo using HTML, Bootstrap, CSS, and JavaScript modules. Includes property discovery, buyer profiles, shortlist, comparison, seller submissions, local enquiries, admin moderation, and a rule-based property assistant.

## Start in VS Code

1. Extract this ZIP and open the `Real Estate` folder in VS Code.
2. Install Node.js if it is not already available.
3. Open the terminal in that folder and run:

   ```sh
   npm start
   ```

4. Open **http://127.0.0.1:5173** in your browser.

No `npm install` is required to run this app. Bootstrap, icons, and property images are bundled locally. Do not open `index.html` by double-clicking: browser ES modules need an HTTP server. You can also use VS Code Live Server.

## Demo login

- Email: `admin@estateledger.test`
- Password: `admin123`

Create any buyer/seller account through Sign up. Use sample credentials only.

## Try the complete workflow

1. Search by city, budget, type, bedrooms, style, or lifestyle.
2. Save a buyer profile, save homes, and compare up to three properties.
3. Save a filtered search and revisit it from Dashboard.
4. Sign up, select List property, and submit a listing.
5. My listings shows its pending review status.
6. Log in as the demo admin, select Admin, and approve it.
7. Open the approved property and submit a callback/visit request.
8. My listings shows the enquiry inbox. The owner or admin can mark an enquiry contacted or closed.
9. Reload the page: listings, enquiries, and saved data persist in this browser.

## Validation

```sh
npm test
npm run check
```

The included service tests cover authentication, filtering, comparison limits, seller/admin permissions, submission and enquiry lifecycle, numeric validation, unsafe image URL rejection, data recovery, and zero-value preservation.

## Scope and limits

This is a frontend demo, not a deployed multiuser service. Data is kept in localStorage on the same browser and origin. Login and admin access are simulated client-side, passwords are stored locally, and must not be used for real accounts. Browser users can inspect or modify the stored data. Changing ports creates a separate browser storage origin.

Callback requests are saved locally; no email, SMS, or call is sent. Saved alerts are bookmarks, not background notifications. The property assistant uses rules and sample listings, not an external AI model. Neighborhood scores, price benchmarks, ROI projections, document checks, and map pins are illustrative. The EMI estimator uses fixed sample assumptions of 8.6% annual interest and a 20-year term. Property images are illustrative.

For a production version, implement a backend API and database, server-side authentication and authorization, password hashing, real document verification, image uploads, notification delivery, and licensed map/location data.

## Project structure

- `index.html` — navigation and app shell
- `assets/css/styles.css` — responsive layout and visual styles
- `assets/js/controllers/` — page rendering and UI interactions
- `assets/js/services/` — data, authentication, matching, enquiries, and assistant logic
- `assets/js/models/` — user and property records
- `assets/js/routes/router.js` — hash routing
- `assets/js/views/templates.js` — reusable cards, formatting, and notifications
- `assets/vendor/` — bundled Bootstrap and icons
- `tools/dev-server.cjs` — local static server
- `tests/services.test.js` — regression coverage

See `docs/FIXES-AND-VALIDATION.md` for the fixes and checks performed. Desktop and mobile previews are included in `docs/`.

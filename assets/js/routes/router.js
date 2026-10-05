import { renderSellerPage } from "../controllers/sellerController.js";
import { renderLoginPage, renderSignupPage } from "../controllers/authController.js";
import { renderComparePage } from "../controllers/comparisonController.js";
import { renderDashboardPage } from "../controllers/dashboardController.js";
import { renderHomePage } from "../controllers/homeController.js";
import { renderAdminPage, renderCreateListingPage, renderPropertiesPage, renderPropertyDetailPage } from "../controllers/listingController.js";

const appRoot = document.querySelector("#appRoot");

export function startRouter() {
  window.addEventListener("hashchange", renderRoute);
  renderRoute();
}

function renderRoute() {
  const route = parseHashRoute(location.hash);
  updateActiveNavigation(route.path);
  window.bootstrap?.Collapse.getInstance(document.querySelector("#mainNavigation"))?.hide();

  if (route.path === "/" || route.path === "") {
    renderHomePage(appRoot);
    return;
  }

  if (route.path === "/properties") {
    renderPropertiesPage(appRoot, route.query);
    return;
  }

  if (route.path.startsWith("/properties/")) {
    renderPropertyDetailPage(appRoot, route.path.replace("/properties/", ""));
    return;
  }

  if (route.path === "/seller") {
    renderSellerPage(appRoot);
    return;
  }

  if (route.path === "/sell") {
    renderCreateListingPage(appRoot);
    return;
  }

  if (route.path === "/compare") {
    renderComparePage(appRoot);
    return;
  }

  if (route.path === "/dashboard") {
    renderDashboardPage(appRoot);
    return;
  }

  if (route.path === "/admin") {
    renderAdminPage(appRoot);
    return;
  }

  if (route.path === "/login") {
    renderLoginPage(appRoot);
    return;
  }

  if (route.path === "/signup") {
    renderSignupPage(appRoot);
    return;
  }

  appRoot.innerHTML = `
    <section class="section-block">
      <div class="container">
        <div class="empty-state">
          <h1 class="h4 fw-bold">Page not found</h1>
          <p class="text-secondary">The route does not exist in this property portal.</p>
          <a class="btn btn-primary" href="#/">Go home</a>
        </div>
      </div>
    </section>
  `;
}

function parseHashRoute(hashText) {
  const cleanedHash = hashText.replace(/^#/, "") || "/";
  const [path, query = ""] = cleanedHash.split("?");

  return { path, query };
}

function updateActiveNavigation(currentPath) {
  document.querySelectorAll(".nav-link").forEach((navigationLink) => {
    const linkPath = navigationLink.getAttribute("href").replace("#", "");
    const isActive = linkPath === currentPath || (linkPath !== "/" && currentPath.startsWith(linkPath));
    navigationLink.classList.toggle("active", isActive);
  });
}

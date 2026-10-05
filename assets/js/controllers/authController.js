import { getCurrentUser, login, logout, signup } from "../services/authService.js";
import { escapeHtml, showToast } from "../views/templates.js";

export function renderAccountActions() {
  const accountActions = document.querySelector("#accountActions");
  if (!accountActions) return;

  const currentUser = getCurrentUser();
  if (!currentUser) {
    accountActions.innerHTML = `
      <a class="btn btn-outline-primary btn-sm" href="#/login">Login</a>
      <a class="btn btn-primary btn-sm" href="#/signup">Sign up</a>
    `;
    return;
  }

  accountActions.innerHTML = `
    <span class="small text-secondary d-none d-md-inline">Hi, ${escapeHtml(currentUser.name)}</span>
    <button class="btn btn-outline-secondary btn-sm" id="logoutButton">Logout</button>
  `;

  accountActions.querySelector("#logoutButton")?.addEventListener("click", () => {
    logout();
    renderAccountActions();
    if (location.hash === "#/" || !location.hash) window.dispatchEvent(new Event("hashchange"));
    else location.hash = "#/";
  });
}

export function renderLoginPage(appRoot) {
  appRoot.innerHTML = `
    <section class="section-block">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-5">
            <div class="auth-panel">
              <h1 class="h3 fw-bold mb-2">Login to EstateLedger</h1>
              <p class="text-secondary">Save homes, list properties, and manage seller enquiries.</p>
              <div class="alert alert-info small">
                Admin demo: admin@estateledger.test / admin123
              </div>
              <form id="loginForm" class="row g-3">
                <div class="col-12">
                  <label class="form-label" for="loginEmail">Email</label>
                  <input class="form-control" id="loginEmail" type="email" autocomplete="email" required>
                </div>
                <div class="col-12">
                  <label class="form-label" for="loginPassword">Password</label>
                  <input class="form-control" id="loginPassword" type="password" autocomplete="current-password" required>
                </div>
                <div class="col-12 d-grid">
                  <button class="btn btn-primary" type="submit">Login</button>
                </div>
              </form>
              <p class="mb-0 mt-3 small">New here? <a href="#/signup">Create an account</a></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  appRoot.querySelector("#loginForm").addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      const loginForm = new FormData(event.currentTarget);
      login(
        appRoot.querySelector("#loginEmail").value,
        appRoot.querySelector("#loginPassword").value
      );
      renderAccountActions();
      showToast("Welcome back.", "success");
      location.hash = "#/";
    } catch (error) {
      console.warn("Login failed", error);
      showToast(error.message, "danger");
    }
  });
}

export function renderSignupPage(appRoot) {
  appRoot.innerHTML = `
    <section class="section-block">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-5">
            <div class="auth-panel">
              <h1 class="h3 fw-bold mb-2">Create your buyer account</h1>
              <p class="text-secondary">A basic account is enough to save homes and submit listings for review.</p>
              <form id="signupForm" class="row g-3">
                <div class="col-12">
                  <label class="form-label" for="signupName">Full name</label>
                  <input class="form-control" id="signupName" name="name" required>
                </div>
                <div class="col-12">
                  <label class="form-label" for="signupEmail">Email</label>
                  <input class="form-control" id="signupEmail" name="email" type="email" autocomplete="email" required>
                </div>
                <div class="col-12">
                  <label class="form-label" for="signupPassword">Password</label>
                  <input class="form-control" id="signupPassword" name="password" type="password" autocomplete="new-password" minlength="6" required>
                </div>
                <div class="col-12 d-grid">
                  <button class="btn btn-primary" type="submit">Create account</button>
                </div>
              </form>
              <p class="mb-0 mt-3 small">Already registered? <a href="#/login">Login</a></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  appRoot.querySelector("#signupForm").addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      const signupForm = Object.fromEntries(new FormData(event.currentTarget));
      signup(signupForm);
      renderAccountActions();
      showToast("Account created.", "success");
      location.hash = "#/";
    } catch (error) {
      console.warn("Signup failed", error);
      showToast(error.message, "danger");
    }
  });
}

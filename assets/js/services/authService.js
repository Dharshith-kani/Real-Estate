import { createUserRecord } from "../models/userModel.js";
import { readActiveUserEmail, readCollection, STORAGE_KEYS, writeActiveUserEmail, writeCollection } from "./storageService.js";

export function getUsers() {
  return readCollection(STORAGE_KEYS.users);
}

export function getCurrentUser() {
  const activeEmail = readActiveUserEmail();
  if (!activeEmail) return null;
  return getUsers().find((registeredUser) => registeredUser.email === activeEmail) || null;
}

export function signup(signupForm) {
  const users = getUsers();
  const email = signupForm.email.trim().toLowerCase();

  if (!String(signupForm.name || "").trim()) throw new Error("Enter your name.");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (signupForm.password.length < 6) {
    throw new Error("Password should be at least 6 characters.");
  }

  if (users.some((registeredUser) => registeredUser.email === email)) {
    throw new Error("This email is already registered.");
  }

  const newUser = createUserRecord(signupForm);
  writeCollection(STORAGE_KEYS.users, [...users, newUser]);
  writeActiveUserEmail(newUser.email);
  return newUser;
}

export function login(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const matchedUser = getUsers().find((registeredUser) => registeredUser.email === normalizedEmail);

  if (!matchedUser || matchedUser.password !== password) {
    throw new Error("Email or password is incorrect.");
  }

  writeActiveUserEmail(matchedUser.email);
  return matchedUser;
}

export function logout() {
  writeActiveUserEmail(null);
}

export function updateCurrentUser(updatedUser) {
  const users = getUsers();
  writeCollection(
    STORAGE_KEYS.users,
    users.map((registeredUser) => registeredUser.email === updatedUser.email ? updatedUser : registeredUser)
  );
}

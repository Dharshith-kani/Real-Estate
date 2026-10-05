export const userRoles = {
  admin: "admin",
  buyer: "buyer"
};

export function createUserRecord(signupForm) {
  return {
    id: `user-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    name: signupForm.name.trim(),
    email: signupForm.email.trim().toLowerCase(),
    password: signupForm.password,
    role: userRoles.buyer,
    savedPropertyIds: [],
    createdAt: new Date().toISOString()
  };
}

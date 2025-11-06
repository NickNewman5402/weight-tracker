// src/lib/auth.ts
export type StoredUser = {
  id?: string;
  userId?: string;    // some older code might use this
  firstName?: string;
  lastName?: string;
  email?: string;
};

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredUser; } catch { return null; }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('jwtToken') ?? sessionStorage.getItem('jwtToken');
}

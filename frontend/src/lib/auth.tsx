// src/lib/auth.ts
export type StoredUser = {
  id?: string;
  userId?: string;    
  firstName?: string;
  lastName?: string;
  email?: string;
  goalWeight?: number;
};

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredUser; } catch { return null; }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('jwtToken') ?? sessionStorage.getItem('jwtToken');
}

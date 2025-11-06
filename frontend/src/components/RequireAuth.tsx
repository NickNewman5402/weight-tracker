import { Navigate, Outlet } from "react-router-dom";

function getStoredToken(): string | null {
  return localStorage.getItem("jwtToken") ?? sessionStorage.getItem("jwtToken");
}

export default function RequireAuth() {
  return getStoredToken() ? <Outlet /> : <Navigate to="/" replace />;
}

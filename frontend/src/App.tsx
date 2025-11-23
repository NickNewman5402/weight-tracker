import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import UserHome from "./pages/UserHome";
import RegistrationPage from "./pages/RegistrationPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/UserHome" element={<UserHome />} />
        <Route path="/RegistrationPage" element={<RegistrationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

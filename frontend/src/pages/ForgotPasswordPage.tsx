import { useState } from "react";

export default function ForgotPasswordPage() {
  const [emailOrLogin, setEmailOrLogin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!emailOrLogin.trim()) {
      setError("Please enter your email or login.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrLogin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setMessage(
          "If an account exists, a reset link has been sent to your email."
        );
      }
    } catch (err) {
      setError("Network error. Try again.");
    }

    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", textAlign: "center" }}>
      <h2>Forgot Password</h2>
      <p style={{ marginBottom: 20 }}>
        Enter your email or login. If we find a matching account, you’ll receive
        a reset link.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Email or login"
          value={emailOrLogin}
          onChange={(e) => setEmailOrLogin(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 6,
            border: "none",
            backgroundColor: "#0066ff",
            color: "white",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 15 }}>{error}</p>}
      {message && <p style={{ color: "green", marginTop: 15 }}>{message}</p>}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [message, setMessage] = useState<string>("Verifying...");
  const [loading, setLoading] = useState<boolean>(true);

  // Remember if we *ever* got a successful verification
  const hasSucceededRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setMessage("Invalid verification link.");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/verify-email/${token}`
        );
        const data = await response.json();

        if (response.ok) {
          hasSucceededRef.current = true;
          setMessage("Email verified successfully! You may now log in.");
        } else {
          if (!hasSucceededRef.current) {
            setMessage(data.error || "Token is invalid or has expired.");
          }
        }
      } catch (err) {
        if (!hasSucceededRef.current) {
          setMessage("Server error. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Email Verification</h1>
      {loading ? <p>Verifying…</p> : <p>{message}</p>}
    </div>
  );
};

export default VerifyEmailPage;

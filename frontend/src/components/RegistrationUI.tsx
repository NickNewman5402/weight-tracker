import React, { useState } from 'react';
import buildPath from './Path'; // default export in your project

function RegistrationUI() {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [login,     setLogin]     = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [message,   setMessage]   = useState('');
  const [loading,   setLoading]   = useState(false);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    if (password !== confirm) {
      setMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(buildPath('register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, login, email, password })
      });
      const data = await resp.json();

      if (!resp.ok || data.error) {
        setMessage(data.error || 'Registration failed.');
        return;
      }

      setMessage('Registered successfully. Please log in.');
      // go to login page (your root route)
      window.location.href = '/';
    } catch (err: any) {
      setMessage(err?.message ?? 'Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="registrationUIDiv" style={{ maxWidth: 420, margin: '24px auto' }}>
      <h2>Create your account</h2>

      <form onSubmit={onRegister}>
        <label>First name<br />
          <input value={firstName} onChange={e=>setFirstName(e.target.value)} required />
        </label><br /><br />
        <label>Last name<br />
          <input value={lastName} onChange={e=>setLastName(e.target.value)} required />
        </label><br /><br />
        <label>Login (username)<br />
          <input value={login} onChange={e=>setLogin(e.target.value)} required />
        </label><br /><br />
        <label>Email<br />
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label><br /><br />
        <label>Password<br />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </label><br /><br />
        <label>Confirm password<br />
          <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        </label><br /><br />

        <button type="submit" className="buttons" disabled={loading}>
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </form>

      <p style={{ marginTop: 10 }}>
        Already have an account? <a href="/">Log in</a>
      </p>

      <span id="registerMessage">{message}</span>
    </div>
  );
}

export default RegistrationUI;

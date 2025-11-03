import React, { useState } from 'react';
import { buildPath } from './Path';
import { jwtDecode } from 'jwt-decode';

function Login() {
  const [message, setMessage] = useState('');
  const [loginName, setLoginName] = React.useState('');
  const [loginPassword, setPassword] = React.useState('');

  async function doLogin(event: any): Promise<void> {
    event.preventDefault();

    const obj = { login: loginName, password: loginPassword };
    const js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/login'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await response.json();
      if (res.error) {
        alert(res.error);
        return;
      }

      const firstName = res.firstName;
      const lastName = res.lastName;
      const userId = res.id;
      const jwtToken = res.jwtToken;

    
      const user = { firstName, lastName, id: userId };
      localStorage.setItem('user_data', JSON.stringify(user));
      localStorage.setItem('token_data', jwtToken);

      setMessage('');
      window.location.href = '/cards';
    } catch (error: any) {
      alert(error.toString());
    }
  }

  return (
    <div id="loginDiv">
      <span id="inner-title">PLEASE LOG IN</span>
      <br />
      Login:{' '}
      <input
        type="text"
        id="loginName"
        placeholder="Username"
        onChange={(e) => setLoginName(e.target.value)}
      />
      <br />
      Password:{' '}
      <input
        type="password"
        id="loginPassword"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="submit"
        id="loginButton"
        className="buttons"
        value="Do It"
        onClick={doLogin}
      />
      <span id="loginResult">{message}</span>
    </div>
  );
}

export default Login;

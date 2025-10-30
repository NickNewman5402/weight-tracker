import React, { useState } from 'react';


function Login()
{
  const [message, setMessage] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setPassword] = useState('');

  // --- Teacher's exact function ---
  async function doLogin(event:any) : Promise<void>
  {
    event.preventDefault();

    var obj = {login:loginName,password:loginPassword};
    var js = JSON.stringify(obj);

    try
    {
      const response = await fetch('http://localhost:5000/api/login',
        {method:'POST',body:js,headers:{'Content-Type': 'application/json'}});

      var res = JSON.parse(await response.text());

      if( res.id <= 0 )
      {
        setMessage('User/Password combination incorrect');
      }
      else
      {
        var user = {firstName:res.firstName,lastName:res.lastName,id:res.id}
        localStorage.setItem('user_data', JSON.stringify(user));

        setMessage('');
        window.location.href = '/cards';
      }
    }
    catch(error:any)
    {
      alert(error.toString());
      return;
    }
  };
  // --- end teacher function ---

  function handleSetLoginName(e: React.ChangeEvent<HTMLInputElement>)
  {
    setLoginName(e.target.value);
  }

  function handleSetPassword(e: React.ChangeEvent<HTMLInputElement>)
  {
    setPassword(e.target.value);
  }

  return (
    <div id="loginDiv">
      <span id="inner-title">PLEASE LOG IN</span><br />
      <form onSubmit={doLogin}>
        Username: <input
          type="text"
          id="loginName"
          placeholder="Username"
          onChange={handleSetLoginName}
        /><br />
        Password: <input
          type="password"
          id="loginPassword"
          placeholder="Password"
          onChange={handleSetPassword}
        /><br />
        <input
          type="submit"
          id="loginButton"
          className="buttons"
          value="Do It"
        />
      </form>
      <span id="loginResult">{message}</span>
    </div>
  );
}

export default Login;

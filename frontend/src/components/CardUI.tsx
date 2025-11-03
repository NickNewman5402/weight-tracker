import React, { useState } from 'react';

const app_name = 'FormaTrack.xyz';
function buildPath(route: string): string
{
  if (import.meta.env.MODE != 'development')
  {
    return 'http://' + app_name + ':5000/' + route;
  }
  else
  {
    return 'http://localhost:5000/' + route;
  }
}

function CardUI()
{
    // --- Teacher variables (get logged-in user) ---
    let _ud: any = localStorage.getItem('user_data');
    let ud = JSON.parse(_ud);
    let userId: string = ud.id;

    // --- React state ---
    const [message, setMessage] = useState('');
    //const [searchResults, setResults] = useState('');
    const [cardList, setCardList] = useState('');
    const [search, setSearchValue] = React.useState('');
    const [card, setCardNameValue] = React.useState('');


    const getToken = () => localStorage.getItem('token_data') || '';
    const saveToken = (t?: string) => { if (t) localStorage.setItem('token_data', t); };

    // --- Add card to backend ---
    async function addCard(e: any): Promise<void> {
  e.preventDefault();

  const body = { userId, card, jwtToken: getToken() }; // include jwtToken

  try {
    const response = await fetch(buildPath('api/addcard'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await response.json();

    if (!response.ok || res.error) {
      setMessage('API Error: ' + (res.error || 'Add failed'));
      return;
    }

    saveToken(res.jwtToken); // refresh token
    setMessage('Card has been added');
  } catch (error: any) {
    setMessage(error.toString());
  }
};


    // --- Search cards from backend ---
    async function searchCard(e:any) {
  e.preventDefault();

  const body = { userId, search, jwtToken: getToken() }; // ← include token

  const response = await fetch(buildPath('api/searchcards'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const res = await response.json();

  if (!response.ok || res.error) {          // ← guard before touching results
    setMessage('API Error: ' + (res.error || 'Search failed'));
    return;
  }

  saveToken(res.jwtToken);                   // ← keep refreshed token
  const results: string[] = Array.isArray(res.results) ? res.results : [];
  setCardList(results.join(', '));
  setMessage('Card(s) have been retrieved');
};

    return (
        <div id="cardUIDiv">
            <h1>COP 4331 MERN Stack Demo</h1>
            <p>Logged In As {ud.firstName} {ud.lastName}</p>

            <input
                type="submit"
                id="logoutButton"
                className="buttons"
                value="Log Out"
                onClick={() => { localStorage.removeItem('user_data'); window.location.href = '/'; }}
            /><br /><br />

            Card To Search For:
            <input
                type="text"
                id="searchText"
                placeholder="Card To Search For"
                onChange={(e) => setSearchValue(e.target.value)}
            />
            <input
                type="submit"
                id="searchCardButton"
                className="buttons"
                value="Search Card"
                onClick={searchCard}
            /><br /><br />

            Card To Add:
            <input
                type="text"
                id="addText"
                placeholder="Card To Add"
                onChange={(e) => setCardNameValue(e.target.value)}
            />
            <input
                type="submit"
                id="addCardButton"
                className="buttons"
                value="Add Card"
                onClick={addCard}
            /><br /><br />

            <span id="cardResult">{message}</span><br/>
            <span id="cardList">{cardList}</span>
        </div>
    );
}

export default CardUI;

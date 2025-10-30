import React, { useState } from 'react';

function CardUI()
{
    // --- Teacher variables (get logged-in user) ---
    let _ud: any = localStorage.getItem('user_data');
    let ud = JSON.parse(_ud);
    let userId: string = ud.id;

    // --- React state ---
    const [message, setMessage] = useState('');
    const [searchResults, setResults] = useState('');
    const [cardList, setCardList] = useState('');
    const [search, setSearchValue] = React.useState('');
    const [card, setCardNameValue] = React.useState('');

    // --- Add card to backend ---
    async function addCard(e:any): Promise<void>
    {
        e.preventDefault();

        let obj = { userId: userId, card: card };
        let js = JSON.stringify(obj);

        try
        {
            const response = await fetch('http://localhost:5000/api/addcard',
                { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);

            if (res.error.length > 0)
            {
                setMessage("API Error: " + res.error);
            }
            else
            {
                setMessage('Card has been added');
            }
        }
        catch (error: any)
        {
            setMessage(error.toString());
        }
    };

    // --- Search cards from backend ---
    async function searchCard(e:any): Promise<void>
    {
        e.preventDefault();

        let obj = { userId: userId, search: search };
        let js = JSON.stringify(obj);

        try
        {
            const response = await fetch('http://localhost:5000/api/searchcards',
                { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

            let txt = await response.text();
            let res = JSON.parse(txt);
            let _results = res.results;
            let resultText = '';
            for (let i = 0; i < _results.length; i++)
            {
                resultText += _results[i];
                if (i < _results.length - 1)
                {
                    resultText += ', ';
                }
            }
            setResults('Card(s) have been retrieved');
            setCardList(resultText);
        }
        catch (error: any)
        {
            alert(error.toString());
            setResults(error.toString());
        }
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

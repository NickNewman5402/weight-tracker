const token = require('./createJWT.js');

// Load Mongoose models
const User = require('./models/user.js');
const Card = require('./models/card.js');

// Simple health-check route
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

exports.setApp = function (app, mongoose) 
{

  // -------------------------
  // /api/addcard
  // -------------------------
  app.post('/api/addcard', async (req, res) => 
            {
                // incoming: userId, card, jwtToken
                // outgoing: error, jwtToken (refreshed)
                const { userId, card, jwtToken } = req.body;

                try 
                {
                    if (token.isExpired(jwtToken)) 
                    {
                        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
                    }
                } 
                
                catch (e) 
                {
                    console.log(e.message);
                    // continue; we’ll still try to process (or you can early return if preferred)
                }

                let error = '';

                try 
                {
                    const newCard = new Card({ Card: card, UserId: userId });
                    await newCard.save(); // Mongoose insert
                } 
                
                catch (e) 
                {
                    error = e.toString();
                }

                let refreshedToken = null;
                
                try 
                {
                    refreshedToken = token.refresh(jwtToken);
                } 
                
                catch (e) 
                {
                    console.log(e.message);
                }

                res.status(200).json({ error, jwtToken: refreshedToken });

            }
        );



  // -------------------------
  // /api/searchcards
  // -------------------------
  app.post('/api/searchcards', async (req, res) => 
            {
                // incoming: userId, search, jwtToken
                // outgoing: results[], error, jwtToken (refreshed)
                let error = '';
                const { userId, search, jwtToken } = req.body;

                try 
                {
                    if (token.isExpired(jwtToken)) 
                    {
                        return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
                    }
                } 
                
                catch (e) 
                {
                    console.log(e.message);
                    // continue
                }

                const _search = (search || '').trim();

                let list = [];
                
                try 
                {
                    //  Mongoose find (starts-with, case-insensitive)
                    const results = await Card.find({
                        Card: { $regex: '^' + _search, $options: 'i' }
                    });

                    // Return just the string values
                    list = results.map(r => r.Card);
                } 
                
                catch (e) 
                {
                    error = e.toString();
                }

                let refreshedToken = null;

                try 
                {
                    refreshedToken = token.refresh(jwtToken);
                } 
                
                catch (e) 
                {
                    console.log(e.message);
                }

                res.status(200).json({ results: list, error, jwtToken: refreshedToken });

            }
        );

        
  // -------------------------
  // /api/login
  // -------------------------
  app.post('/api/login', async (req, res) => 
            {
                // incoming: login, password
                // outgoing: token OR error
                let ret;

                try 
                {
                    const { login, password } = req.body;

                    // Mongoose find
                    const results = await User.find({ Login: login, Password: password });

                    if (results.length > 0) 
                    {
                        const id = results[0].UserID;
                        const fn = results[0].FirstName;
                        const ln = results[0].LastName;

                        try 
                        {
                            const jwt = require('./createJWT.js');
                            ret = jwt.createToken(fn, ln, id);
                        } 
                        
                        catch (e) 
                        {
                            ret = { error: e.message };
                        }
                    } 
                    

                    else 
                    {
                        ret = { error: 'Login/Password incorrect' };
                    }

                } 
                
                catch (e) 
                {
                    ret = { error: e.toString() };
                }

                res.status(200).json(ret);
                
            }
        );
};

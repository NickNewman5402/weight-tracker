const token = require('./createJWT.js');

// Load Mongoose models
const User = require('./models/user.js');
const RegisterUser = require('./models/userRegistration.js')
const Card = require('./models/card.js');

// routes/api.js (or server.js)
//const router = express.Router();








exports.setApp = function (app, mongoose) 
{


app.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, login, email, password } = req.body;

    if (!firstName || !lastName || !login || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({
      $or: [{ login: login.toLowerCase() }, { email: email.toLowerCase() }]
    });
    if (existing) return res.status(409).json({ error: 'Login or email already in use.' });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      login: login.toLowerCase(),
      email: email.toLowerCase(),
      password: hash
    });

    return res.status(201).json({
      message: 'Registered successfully.',
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, login: user.login, email: user.email }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});



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
//   // -------------------------
const token = require('./createJWT.js');

app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;

  if (login === 'RickL' && password === 'COP4331') {
    const jwtToken = token.createToken('Rick', 'Leinecker', 1);
    res.status(200).json({
      id: 1,
      firstName: 'Rick',
      lastName: 'Leinecker',
      jwtToken
    });
    return;
  }

  res.status(200).json({ error: 'Login/Password incorrect' });
});





//   app.post('/api/login', async (req, res) => 
//             {
//                 // incoming: login, password
//                 // outgoing: token OR error
//                 let ret;

//                 try 
//                 {
//                     const { login, password } = req.body;

//                     // Mongoose find
//                     const results = await User.find({ Login: login, Password: password });

//                     if (results.length > 0) 
//                     {
//                         const id = results[0].UserID;
//                         const fn = results[0].FirstName;
//                         const ln = results[0].LastName;

//                         try 
//                         {
//                             const jwt = require('./createJWT.js');
//                             ret = jwt.createToken(fn, ln, id);
//                         } 
                        
//                         catch (e) 
//                         {
//                             ret = { error: e.message };
//                         }
//                     } 
                    

//                     else 
//                     {
//                         ret = { error: 'Login/Password incorrect' };
//                     }

//                 } 
                
//                 catch (e) 
//                 {
//                     ret = { error: e.toString() };
//                 }

//                 res.status(200).json(ret);
                
//             }
//         );
};

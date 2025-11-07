const bcrypt = require('bcryptjs');
const token = require('./createJWT.js');
const User = require('./models/userRegistration.js')



exports.setApp = function (app, mongoose) 
{

  app.post('/api/register', async (req, res) => {
    try 
    {
    
      console.log('[HIT] /api/register real handler'); // ...rest...


      const { firstName, lastName, login, email, password } = req.body;

      if (!firstName || !lastName || !login || !email || !password) 
      {
        return res.status(400).json({ error: 'All fields are required.' });
      }

      if (password.length < 8) 
      {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      }

      // Check if login or email already exist
      const existing = await User.findOne({
        $or: [{ login }, { email }]
      }).lean();

      if (existing) 
      {
        return res.status(409).json({ error: 'Login or email already in use.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await User.create({
        firstName,
        lastName,
        login,
        email,
        password: hashedPassword
      });

      return res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          login: user.login,
          email: user.email
        }
      });
    } 
    
    catch (err) 
    {
      console.error('Registration error:', err);

      if (err && err.code === 11000) 
      {
        return res.status(409).json({ error: 'Login or email already in use.' });
      }

      res.status(500).json({ error: 'Server error' });
    }
});

        
  // -------------------------
  // /api/login
  // -------------------------

  app.post('/api/login', async (req, res) => {
    try 
    {
      const { login, password } = req.body;

      const user = await User.findOne({ login });
      if (!user) 
      {
        return res.status(401).json({ error: 'Login/Password incorrect' });
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) 
      {
        return res.status(401).json({ error: 'Login/Password incorrect' });
      }

      // Create token (if you use JWT)
      const jwtToken = token.createToken(user.firstName, user.lastName, user._id);

      res.json({
        jwtToken,                       // <-- string
        user: { id: user._id, firstName, lastName, email: user.email }
      });

    } 
    
    catch (err) 
    {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });


    // -------------------------
  // /api/health
  // -------------------------

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));




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

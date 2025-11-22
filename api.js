const bcrypt = require('bcryptjs');
const token = require('./createJWT.js');
const jwt = require('jsonwebtoken');
const User = require('./models/userRegistration.js')
const WeighIn = require("./models/WeighIn.js");

/**********************************************************************************************
 * 
 *                                    JWT HELPER
 * 
 * ********************************************************************************************/
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

function authenticate(req, res, next) 
{
  const authHeader = req.headers["authorization"] || "";
  const [scheme, rawToken] = authHeader.split(" ");

  if (scheme !== "Bearer" || !rawToken) 
  {
    return res.status(401).json({ error: "Missing or invalid auth header" });
  }

  jwt.verify(rawToken, ACCESS_TOKEN_SECRET, (err, payload) => {
                if (err) 
                {
                  console.error("JWT verify error:", err);
                  return res.status(403).json({ error: "Invalid or expired token" });
                }

                // in /api/login you sign { userId, firstName, lastName }
                // so we’ll mirror that shape here:
                req.user = { id: payload.userId };
                next();
              }
            );  
}



exports.setApp = function (app, mongoose) 
{

  /*****************************************************************************************************************************
   * 
   *                                                  /API/REGISTER
   * 
   *****************************************************************************************************************************/

  app.post('/api/register', async (req, res) => 
            {
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
                    user: 
                    {
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
            }
          );
          
  /*****************************************************************************************************************************
   * 
   *                                                  /API/LOGIN
   * 
   *****************************************************************************************************************************/

  app.post('/api/login', async (req, res) => 
            {
              try {
                const { login, password } = req.body || {};
                if (!login || !password) {
                  return res.status(400).json({ error: 'Missing login or password.' });
                }

                // allow login by username or email
                const q = String(login).toLowerCase();
                const user = await User.findOne({ $or: [{ login: q }, { email: q }] }).lean();

                if (!user) {
                  return res.status(401).json({ error: 'User does not exist' });
                }

              //  console.log('DEBUG login attempt:', {
              //         login,
              //         userFound: !!user,
              //         storedHash: user?.password?.slice(0, 20) + '...', // show only part of it
              //         passwordAttempt: password,
              //       });

                    const ok = await bcrypt.compare(password, user.password || '');
                   // console.log('bcrypt.compare result:', ok);
                
                if (!ok) {
                  return res.status(401).json({ error: 'Login/Password incorrect' });
                }

                const secret = process.env.ACCESS_TOKEN_SECRET;
                if (!secret) {
                  return res.status(500).json({ error: 'Server misconfigured: ACCESS_TOKEN_SECRET missing' });
                }

                // build JWT with FIELDS FROM user (not bare vars)
                const token = jwt.sign(
                  {
                    userId: String(user._id),
                    firstName: user.firstName || '',
                    lastName:  user.lastName  || ''
                  },
                  secret,
                  { expiresIn: '24h' }
                );

                // keep your current response shape that the frontend now understands
                return res.json({
                  jwtToken: {
                    id:        String(user._id),
                    firstName: user.firstName || '',
                    lastName:  user.lastName  || '',
                    email:     user.email     || '',
                    jwtToken:  token
                  }
                });
              } catch (err) {
                console.error('Login error:', err);
                return res.status(500).json({ error: 'Server error' });
              }
            }
          );

  /*****************************************************************************************************************************
   * 
   *                                                  /API/HEALTH
   * 
   *****************************************************************************************************************************/

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  /*****************************************************************************************************************************
   * 
   *                                                  /API/WEIGHTS
   * 
   *****************************************************************************************************************************/

  app.post('/api/weights', authenticate, async (req, res) => {
              try 
              {
                const { date, weight, note } = req.body;

                if (!date || !weight) 
                {
                  return res.status(400).json({ error: "date and weight are required" });
                }

                const userId = req.user && req.user.id;
                if (!userId) 
                {
                  return res.status(401).json({ error: "User not authenticated" });
                }

                // IMPORTANT: interpret the date string as local midnight, not UTC
                const localMidnight = new Date(`${date}T00:00:00`);

                const entry = await WeighIn.create
                ({
                  userId,
                  date: localMidnight,
                  weight: Number(weight),
                  note: note || "",
                });

                return res.status(201).json({ weighIn: entry });
              } 
              
              catch (err) 
              {
                console.error("Error creating weigh-in", err);
                return res.status(500).json({ error: "Failed to save weigh-in" });
              }
            }
          );

  /*****************************************************************************************************************************
   * 
   *                                                  /API/WEIGHTS/RECENT
   * 
   *****************************************************************************************************************************/

  app.get('/api/weights/recent', authenticate, async (req, res) => {
              try 
              {
                const userId = req.user && req.user.id;

                if (!userId) 
                {
                  return res.status(401).json({ error: "User not authenticated" });
                }

                const limit = parseInt(req.query.limit, 10) || 10;

                const entries = await WeighIn.find({ userId })
                  .sort({ date: -1 })          // newest → oldest
                  .limit(limit)
                  .lean();

                return res.status(200).json({ entries });
              }


              catch (err) 
              {
                console.error("Error loading recent entries:", err);
                return res.status(500).json({ error: "Failed to load recent entries" });
              }
              
            }
          );

  /*****************************************************************************************************************************
   * 
   *                                                  DELETE /API/WEIGHTS/:id
   * 
   *****************************************************************************************************************************/

  app.delete('/api/weights/:id', authenticate, async (req, res) => {
                try 
                {
                  const userId = req.user && req.user.id;
                  if (!userId) 
                  {
                    return res.status(401).json({ error: "User not authenticated" });
                  }

                  const { id } = req.params;

                  const deleted = await WeighIn.findOneAndDelete({ _id: id, userId });

                  if (!deleted) 
                  {
                    return res.status(404).json({ error: "Weigh-in not found" });
                  }

                  return res.status(200).json({ message: "Weigh-in deleted" });
                } 
                
                catch (err) 
                {
                  console.error("Error deleting weigh-in:", err);
                  return res.status(500).json({ error: "Failed to delete weigh-in" });
                }
              }
            );

  /*****************************************************************************************************************************
   * 
   *                                                  PUT /API/WEIGHTS/:id
   * 
   *****************************************************************************************************************************/

  app.put('/api/weights/:id', authenticate, async (req, res) => {
              try 
              {
              
                const userId = req.user && req.user.id;
                if (!userId) 
                {
                  return res.status(401).json({ error: "User not authenticated" });
                }

                const { id } = req.params;
                const { date, weight, note } = req.body;

                const entry = await WeighIn.findOne({ _id: id, userId });

                if (!entry) 
                {
                  return res.status(404).json({ error: "Weigh-in not found" });
                }

                if (date) 
                {
                  entry.date = new Date(`${date}T00:00:00`);
                }

                if (typeof weight !== "undefined") 
                {
                  entry.weight = Number(weight);
                }

                if (typeof note !== "undefined") 
                {
                  entry.note = note;
                }

                await entry.save();

                return res.status(200).json({ weighIn: entry });
              } 
              
              catch (err) 
              {
                console.error("Error updating weigh-in:", err);
                return res.status(500).json({ error: "Failed to update weigh-in" });
              }

            }
          );

};

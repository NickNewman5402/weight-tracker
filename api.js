// api.js
const token = require('./createJWT.js');
const BodyWeight = require('./models/bodyweight.js');


exports.setApp = function (app) 
{
  // Minimal LOGIN (no DB yet): accepts any login/password and returns a token
  app.post('/api/auth/login', async (req, res) => 
            {
              try 
              {
                const { login, password } = req.body;

                if (!login || !password) 
                {
                  return res.status(200).json({ error: 'Login and password required' });
                } 

                // Temporary fake user; we'll wire DB later
                const fakeUser = 
                {
                  UserId: 1,
                  FirstName: 'Nick',
                  LastName: 'Newman'
                };

                const t = token.createToken(fakeUser.FirstName, fakeUser.LastName, fakeUser.UserId);
                
                return res.status(200).json(t); // { accessToken }
              } 
              
              catch (e) 
              {
                return res.status(500).json({ error: e.message });
              }
            }
          );


  // --- In-memory storage for now (swap to mongo later)
  //const bodyweights = []; // each item: { UserId, date, weight, notes }

  function asDateUTC(yyyy_mm_dd) 
  {
    return new Date(`${yyyy_mm_dd}T00:00:00.000Z`);
  }

  // tiny helper to require a valid JWT and return { userId, refreshed }
  function requireJwtAndRefresh(req, res, tokenLib) 
  {
    const { jwtToken } = req.body || {};

    if (!jwtToken || tokenLib.isExpired(jwtToken)) 
    {
      res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
      return null;
    }
    
    const jwt = require('jsonwebtoken');
    const ud = jwt.decode(jwtToken);
    const refreshed = tokenLib.refresh(jwtToken);
    
    return { userId: ud.userId, refreshed };
  }

  // ADD/UPSERT one bodyweight entry
  // body: { date:"YYYY-MM-DD", weight, notes, jwtToken }
  app.post('/api/bodyweight', async (req, res) => 
            {
              const ctx = requireJwtAndRefresh(req, res, token);
              if (!ctx) return;

              const { date, weight, notes } = req.body || {};
              if (!date || !weight) 
              {
                return res
                  .status(200)
                  .json({ error: 'date and weight required', jwtToken: ctx.refreshed.accessToken });
              }

              try 
              {
                const d = asDateUTC(date);

                await BodyWeight.findOneAndUpdate
                (
                  { UserId: ctx.userId, date: d },
                  { $set: { weight, notes: notes || '' } },
                  { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                return res.status(200).json({ error: '', jwtToken: ctx.refreshed.accessToken });
              } 
              
              catch (e) 
              {
                return res.status(200).json({ error: e.message, jwtToken: ctx.refreshed.accessToken });
              }
            }
          );


  // LIST range
  // body: { from:"YYYY-MM-DD", to:"YYYY-MM-DD", jwtToken }
  app.post('/api/bodyweight/list', async (req, res) => 
            {
              const ctx = requireJwtAndRefresh(req, res, token);
              if (!ctx) return;

              try 
              {
                const { from, to } = req.body || {};
                const q = { UserId: ctx.userId };

                if (from || to) 
                {
                  q.date = {};
                  if (from) q.date.$gte = asDateUTC(from);
                  if (to)   q.date.$lte = asDateUTC(to);
                }

                const rows = await BodyWeight.find(q).sort({ date: 1 }).lean();

                return res
                  .status(200)
                  .json({ results: rows, error: '', jwtToken: ctx.refreshed.accessToken });
              } 
              
              catch (e) 
              {
                return res.status(200).json({ error: e.message, jwtToken: ctx.refreshed.accessToken });
              }
            }
          );
    
};


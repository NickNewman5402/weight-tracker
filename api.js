const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
//const nodemailer = require('nodemailer');
const User = require('./models/user.js')
const WeighIn = require("./models/WeighIn.js");
const token = require('./createJWT.js');
const sendEmail = require('./sendEmail');  



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


  const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@formatrack.local';
  const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

  // Configure your SMTP transport (example: Gmail with app password)
  /*const transporter = nodemailer.createTransport
  ({
    host: process.env.SMTP_HOST,   // e.g. "smtp.gmail.com"
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,                 // true if using 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });*/

 /* async function sendEmail({ to, subject, html }) 
  {
    await transporter.sendMail
    ({
      from: EMAIL_FROM,
      to,
      subject,
      html
    });
  }*/



exports.setApp = function (app, mongoose) 
{


  /*****************************************************************************************************************************
   * 
   *                                        /API/REQUEST-PASSWORD-RESET
   * 
   *****************************************************************************************************************************/

  app.post('/api/request-password-reset', async (req, res) => 
  {
    try 
    {
      const { emailOrLogin } = req.body || {};

      if (!emailOrLogin)
        return res.status(400).json({ error: "emailOrLogin is required." });

      const query = String(emailOrLogin).toLowerCase();

      const user = await User.findOne(
      {
        $or: [
          { email: query },
          { login: query }
        ]
      });

      // To avoid leaking which accounts exist
      if (!user) 
      {
        return res.json({ message: "If an account exists, a reset link has been sent." });
      }

      const resetToken = user.createPasswordResetToken();
      await user.save();

      const resetUrl = `${FRONTEND_BASE_URL}/reset-password/${resetToken}`;

      await sendEmail(
      {
        to: user.email,
        subject: "Reset your FormaTrack password",
        html: `
          <p>Hello ${user.firstName},</p>
          <p>You requested a password reset.</p>
          <p><a href="${resetUrl}">Click here to reset your password</a></p>
          <p>This link is valid for 1 hour.</p>
        `
      });

      return res.json({ message: "If an account exists, a reset link has been sent." });
    }
    catch (err)
    {
      console.error("Password reset request error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });


  /*****************************************************************************************************************************
   * 
   *                                                  /API/RESET-PASSWORD
   * 
   *****************************************************************************************************************************/

  app.post('/api/reset-password/:token', async (req, res) => 
            {
              try 
              { 
                const { token } = req.params;
                const { newPassword } = req.body || {};

                if (!newPassword || newPassword.length < 8) 
                {
                  return res.status(400).json({ error: 'Password must be at least 8 characters.' });
                }

                const hashed = crypto.createHash('sha256').update(token).digest('hex');

                const user = await User.findOne
                ({
                  passwordResetToken: hashed,
                  passwordResetExpires: { $gt: Date.now() }
                });

                if (!user) 
                {
                  return res.status(400).json({ error: 'Token is invalid or has expired.' });
                }

                user.password = await bcrypt.hash(newPassword, 12);
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;

                // optional: verify email as part of reset
                user.isVerified = true;

                await user.save();

                return res.json({ message: 'Password reset successful. You can now log in.' });
              } 
              
              catch (err) 
              {
                console.error('Reset password error:', err);
                return res.status(500).json({ error: 'Server error' });
              }
            }
          );  

  /*****************************************************************************************************************************
   * 
   *                                                  /API/REGISTER
   * 
   *****************************************************************************************************************************/

    app.post('/api/register', async (req, res) => 
              {
                try 
                {
                  console.log('[HIT] /api/register real handler');

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

                  // Create user instance but DON'T save yet
                  let user = new User({
                    firstName,
                    lastName,
                    login,
                    email,
                    password: hashedPassword
                  });

                  // 🔑 Create verification token and save it to user
                  const verifyToken = user.createEmailVerificationToken();

                  // Save user with verification token + expiry
                  await user.save();

                  // Build frontend verification URL
                  const verifyUrl = `${FRONTEND_BASE_URL}/verify-email/${verifyToken}`;
                  console.log("Verify URL:", verifyUrl);

                  try 
                  {
                    await sendEmail({
                      to: email,
                      subject: "Verify your FormaTrack email",
                      html: `
                        <p>Hello ${firstName},</p>
                        <p>Thanks for signing up for FormaTrack.</p>
                        <p><a href="${verifyUrl}">Click here to verify your email</a></p>
                        <p>If you did not sign up, you can ignore this email.</p>
                      `
                    });
                  } 
                  
                  catch (emailErr) 
                  {
                    console.warn("Email send failed (dev mode only):", emailErr.message || emailErr);
                    // DO NOT throw here – we still want registration to succeed
                  }

                  // // ✉ Send verification email
                  // await sendEmail({
                  //   to: user.email,
                  //   subject: 'Verify Your FormaTrack Account',
                  //   html: `
                  //     <p>Hello ${user.firstName},</p>
                  //     <p>Please verify your FormaTrack account by clicking the link below:</p>
                  //     <p><a href="${verifyUrl}">Verify Email</a></p>
                  //   `
                  // });

                  return res.status(201).json({
                    message: 'Registration successful. Please check your email to verify your account.'
                  });
                } 
                catch (err) 
                {
                  console.error('Registration error:', err);

                  if (err && err.code === 11000) 
                  {
                    return res.status(409).json({ error: 'Login or email already in use.' });
                  }

                  return res.status(500).json({ error: 'Server error' });
                }
              }
            );

    /*****************************************************************************************************************************
   * 
   *                                                  /API/VERIFY-EMAIL
   * 
   *****************************************************************************************************************************/

  app.get('/api/verify-email/:token', async (req, res) => 
            {
              try 
              {
                const { token } = req.params;

                // hash the token from URL
                const hashed = crypto
                  .createHash('sha256')
                  .update(token)
                  .digest('hex');

                // look up user with matching token and non-expired window
                const user = await User.findOne(
                {
                  verificationToken: hashed,
                  verificationTokenExpires: { $gt: Date.now() }
                });

                if (!user) 
                {
                  return res.status(400).json({ error: 'Token is invalid or has expired.' });
                }

                // mark verified and clear token
                user.isVerified = true;
                user.verificationToken = undefined;
                user.verificationTokenExpires = undefined;

                await user.save();

                return res.json({ message: 'Email verified successfully. You can now log in.' });
              } 
              catch (err) 
              {
                console.error('Verify email error:', err);
                return res.status(500).json({ error: 'Server error' });
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
                    const ok = await bcrypt.compare(password, user.password || '');
                   // console.log('bcrypt.compare result:', ok);
                
                if (!ok) {
                  return res.status(401).json({ error: 'Login/Password incorrect' });
                }

                if (!user.isVerified) {
                  return res.status(403).json({ error: 'Please verify your email before logging in.' });
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

  app.post('/api/weights', authenticate, async (req, res) => 
            {
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

  app.get('/api/weights/recent', authenticate, async (req, res) => 
            {
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

  app.delete('/api/weights/:id', authenticate, async (req, res) => 
              {
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

  app.put('/api/weights/:id', authenticate, async (req, res) => 
            {
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

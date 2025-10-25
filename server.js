// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// --- FIXED CORS CONFIG (explicitly handle preflight) ---
app.use(cors());

app.options('*', (req, res) => 
              {
                res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
                res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                res.sendStatus(204);
              }
            );

app.use(express.json());

// optional logger
app.use((req, _res, next) => 
          {
          console.log(`${req.method} ${req.url}`);
          next();
          }
        );



const api = require('./api.js');
api.setApp(app);


// Health check route
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));

// Database
const mongoose = require('mongoose');

const url = process.env.MONGODB_URI;
mongoose.connect(url)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Public folder serve karein
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', require('./routes/signupRoutes'));

// Database Connection (Direct local MongoDB URL)
// mongoose.connect('mongodb://127.0.0.1:27017/omnifood') //local-Server
// mongoose.connect('mongodb+srv://scrapper:Omnifood12345@scrapper.hfh8ruq.mongodb.net/omnifood?retryWrites=true&w=majority&appName=Scrapper')
// mongoose.connect(process.env.MONGO_URI)
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('MongoDB Database se connect ho gaya!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
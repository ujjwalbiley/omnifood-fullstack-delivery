const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');

router.post('/signup', async (req, res) => {
  try {
    const { name, email, interest, billing, source, message, newsletter, order, orderTotal } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name aur Email zaroori hain.' });
    }

    const newSubmission = new Submission({
      name,
      email,
      interest,
      billing,
      source,
      message,
      newsletter,
      order,
      orderTotal
    });

    await newSubmission.save();
    return res.status(201).json({ success: true, message: 'Data save ho gaya!' });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
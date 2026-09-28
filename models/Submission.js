const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  interest: { type: String, default: 'unsure' },
  billing: { type: String, default: 'monthly' },
  source: { type: String, default: 'friends' },
  message: { type: String, default: '' },
  newsletter: { type: Boolean, default: true },
  order: { type: Object, default: {} },
  orderTotal: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', submissionSchema);

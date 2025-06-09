const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Test', testSchema);
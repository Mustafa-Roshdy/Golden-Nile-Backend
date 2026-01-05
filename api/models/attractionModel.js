const mongoose = require('mongoose');

const attractionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['historical', 'nature', 'museum', 'cultural', 'landmark', 'religious', 'activity', 'market']
  },
  opening_time: {
    type: String,
    required: true
  },
  closing_time: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true,
    enum: ['aswan', 'luxor']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attraction', attractionSchema);
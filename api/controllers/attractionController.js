const Attraction = require('../models/attractionModel.js');
const fs = require('fs');
const path = require('path');

// Path to attractions.json
const ATTRACTIONS_PATH = path.join(__dirname, '..', 'attractions.json');

// Create a single attraction
const createAttraction = async (req, res) => {
  try {
    const attraction = new Attraction(req.body);
    await attraction.save();
    res.status(201).json({ success: true, data: attraction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Seed attractions for a specific city
const seedAttractionsForCity = async (req, res) => {
  try {
    const { city } = req.params;
    if (!['aswan', 'luxor'].includes(city)) {
      return res.status(400).json({ success: false, message: 'Invalid city. Must be aswan or luxor.' });
    }

    // Read the JSON file
    const attractionsData = JSON.parse(fs.readFileSync(ATTRACTIONS_PATH, 'utf8'));

    if (!attractionsData[city]) {
      return res.status(404).json({ success: false, message: `No data found for city: ${city}` });
    }

    // Prepare attractions with city field
    const attractionsToInsert = attractionsData[city].map(attraction => ({
      ...attraction,
      city
    }));

    // Insert into database
    const insertedAttractions = await Attraction.insertMany(attractionsToInsert);

    res.status(201).json({
      success: true,
      message: `Seeded ${insertedAttractions.length} attractions for ${city}`,
      data: insertedAttractions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all attractions
const getAttractions = async (req, res) => {
  try {
    const { city, category } = req.query;
    let query = {};
    if (city) query.city = city;
    if (category) query.category = category;

    const attractions = await Attraction.find(query);
    res.json({ success: true, data: attractions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get attraction by ID
const getAttractionById = async (req, res) => {
  try {
    const attraction = await Attraction.findById(req.params.id);
    if (!attraction) {
      return res.status(404).json({ success: false, message: 'Attraction not found' });
    }
    res.json({ success: true, data: attraction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update attraction
const updateAttraction = async (req, res) => {
  try {
    const attraction = await Attraction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!attraction) {
      return res.status(404).json({ success: false, message: 'Attraction not found' });
    }
    res.json({ success: true, data: attraction });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete attraction
const deleteAttraction = async (req, res) => {
  try {
    const attraction = await Attraction.findByIdAndDelete(req.params.id);
    if (!attraction) {
      return res.status(404).json({ success: false, message: 'Attraction not found' });
    }
    res.json({ success: true, message: 'Attraction deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAttraction,
  seedAttractionsForCity,
  getAttractions,
  getAttractionById,
  updateAttraction,
  deleteAttraction
};
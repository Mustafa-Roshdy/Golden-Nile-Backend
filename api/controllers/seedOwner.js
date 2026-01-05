const bcrypt = require('bcryptjs');
const User = require('../models/userModel.js');
const seedOwner = async () => {
  try {
    // Check if owner already exists
    const existingOwner = await User.findOne({ role: 'supervisor' });

    if (existingOwner) {
      console.log('Owner user already exists');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create owner user
    const owner = new User({
      email: 'admin@.com',
      password: hashedPassword,
      role: 'supervisor',
      firstName: 'System',
      lastName: 'Administrator',
      gender: 'male',
      age: 25,
      userId: 1, // or generate dynamically
    });

    await owner.save();
    console.log('Owner user created: email=admin@admin.com, password=admin123');
  } catch (error) {
    console.error('Error seeding owner:', error);
  }
};

module.exports = seedOwner;
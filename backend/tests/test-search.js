const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/safestay';

console.log('Testing hostel search query...\n');

mongoose.connect(mongoUri)
  .then(async () => {
    const User = require('./models/User');  // Load User model first
    const Hostel = require('./models/Hostel');
    
    // Simulate the search query with showAll=true
    const query = {};
    
    const hostels = await Hostel.find(query)
      .populate('owner', 'name phone')
      .limit(100)
      .sort({ rating: -1 });
    
    console.log(`Found ${hostels.length} hostels:\n`);
    
    hostels.forEach((h, i) => {
      console.log(`${i + 1}. ${h.name}`);
      console.log(`   Available: ${h.availableRooms}/${h.totalRooms} rooms`);
      console.log(`   Verified: ${h.verificationStatus}`);
      console.log(`   Active: ${h.isActive}`);
      console.log(`   Location: ${h.address?.city || 'N/A'}\n`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });

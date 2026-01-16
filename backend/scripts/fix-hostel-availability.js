const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/safestay';

console.log('Connecting to MongoDB...');

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected successfully!\n');
    
    const Hostel = require('./models/Hostel');
    const Room = require('./models/Room');
    
    const hostels = await Hostel.find({});
    
    console.log('=== Hostel Availability Status ===\n');
    
    for (const hostel of hostels) {
      const totalRooms = await Room.countDocuments({ hostel: hostel._id });
      const availableRooms = await Room.countDocuments({ hostel: hostel._id, isAvailable: true });
      const occupiedRooms = totalRooms - availableRooms;
      
      console.log(`📍 ${hostel.name}`);
      console.log(`   Database field 'availableRooms': ${hostel.availableRooms}`);
      console.log(`   Database field 'totalRooms': ${hostel.totalRooms}`);
      console.log(`   Actual total rooms: ${totalRooms}`);
      console.log(`   Actual available rooms: ${availableRooms}`);
      console.log(`   Occupied rooms: ${occupiedRooms}`);
      
      // Fix the hostel fields
      hostel.totalRooms = totalRooms;
      hostel.availableRooms = availableRooms;
      await hostel.save();
      console.log(`   ✅ Updated hostel fields\n`);
    }
    
    console.log('🎉 All hostels updated successfully!\n');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });

const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/safestay';

console.log('Connecting to MongoDB...');

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('Connected successfully!\n');
    
    const Contract = require('./models/Contract');
    const Room = require('./models/Room');
    const Hostel = require('./models/Hostel');
    
    // Delete all contracts
    const contractResult = await Contract.deleteMany({});
    console.log(`✅ Deleted ${contractResult.deletedCount} contracts`);
    
    // Reset all rooms
    const rooms = await Room.find({});
    console.log(`\nResetting ${rooms.length} rooms...`);
    
    for (const room of rooms) {
      room.tenants = [];
      room.currentOccupancy = 0;
      room.isAvailable = true;
      await room.save();
    }
    
    console.log(`✅ Reset all rooms (cleared tenants, set occupancy to 0, marked available)`);
    
    // Update hostels available rooms count
    const hostels = await Hostel.find({});
    console.log(`\nUpdating ${hostels.length} hostels...`);
    
    for (const hostel of hostels) {
      const hostelRooms = await Room.countDocuments({ hostel: hostel._id });
      hostel.availableRooms = hostelRooms;
      await hostel.save();
    }
    
    console.log(`✅ Updated hostel available room counts`);
    
    console.log('\n🎉 Database cleaned successfully! Ready for fresh bookings.\n');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });

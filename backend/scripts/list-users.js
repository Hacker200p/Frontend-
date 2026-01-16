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
    const User = require('./models/User');
    const users = await User.find({}).select('name email role phoneVerified');
    
    if (users.length === 0) {
      console.log('No users found in database.\n');
      process.exit(0);
      return;
    }
    
    console.log('=== Users in Database ===\n');
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Phone Verified: ${u.phoneVerified ? 'Yes' : 'No'}\n`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });

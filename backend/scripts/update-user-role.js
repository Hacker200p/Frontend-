const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safestay', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const User = require('./models/User');

async function updateUserRole() {
  try {
    // Get email from command line argument
    const email = process.argv[2];
    const newRole = process.argv[3] || 'tenant';

    if (!email) {
      console.log('Usage: node update-user-role.js <email> [role]');
      console.log('Available roles: master_admin, owner, canteen_provider, tenant');
      console.log('Example: node update-user-role.js user@example.com tenant');
      process.exit(1);
    }

    // Find and update user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`\nFound user: ${user.name} (${user.email})`);
    console.log(`Current role: ${user.role}`);
    
    user.role = newRole;
    await user.save();
    
    console.log(`✅ User role updated to: ${newRole}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating user:', error);
    process.exit(1);
  }
}

updateUserRole();

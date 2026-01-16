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
    
    // Get email from command line
    const email = process.argv[2];
    const newRole = process.argv[3] || 'tenant';
    
    if (!email) {
      // List all users
      const users = await User.find({}).select('name email role phoneVerified');
      
      if (users.length === 0) {
        console.log('No users found in database.');
        console.log('\nUsage: node fix-user-role.js <email> [role]');
        console.log('Available roles: master_admin, owner, canteen_provider, tenant\n');
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
      
      console.log('Usage: node fix-user-role.js <email> [role]');
      console.log('Available roles: master_admin, owner, canteen_provider, tenant');
      console.log('Example: node fix-user-role.js user@example.com tenant\n');
      process.exit(0);
      return;
    }
    
    // Update user role
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      process.exit(1);
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`Current role: ${user.role}`);
    
    if (user.role === newRole) {
      console.log(`✅ User already has role: ${newRole}\n`);
      process.exit(0);
      return;
    }
    
    user.role = newRole;
    await user.save();
    
    console.log(`✅ User role updated to: ${newRole}`);
    console.log(`\n⚠️  IMPORTANT: Log out and log back in to apply the changes!\n`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });

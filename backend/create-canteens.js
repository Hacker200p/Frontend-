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
    
    const Hostel = require('./models/Hostel');
    const Canteen = require('./models/Canteen');
    const User = require('./models/User');
    
    // Get hostels without canteens
    const hostels = await Hostel.find({ canteen: null }).populate('owner');
    
    if (hostels.length === 0) {
      console.log('❌ No hostels without canteens found.');
      process.exit(0);
      return;
    }
    
    console.log(`Found ${hostels.length} hostels without canteens:\n`);
    hostels.forEach((h, i) => {
      console.log(`${i + 1}. ${h.name} (Owner: ${h.owner?.name || 'Unknown'})`);
    });
    
    console.log('\n\n=== Creating Canteens ===\n');
    
    // Create a canteen provider if one doesn't exist
    let canteenProvider = await User.findOne({ role: 'canteen_provider' });
    
    if (!canteenProvider) {
      console.log('Creating canteen provider user...');
      canteenProvider = await User.create({
        name: 'Canteen Admin',
        email: 'canteen@safestay.com',
        password: '$2b$10$YourHashedPasswordHere', // This should be properly hashed in production
        phone: '+919876543210',
        role: 'canteen_provider',
        phoneVerified: true,
        emailVerified: true,
      });
      console.log('✓ Created canteen provider:', canteenProvider.name);
    } else {
      console.log('✓ Using existing canteen provider:', canteenProvider.name);
    }
    
    // Create canteen for each hostel without one
    for (const hostel of hostels) {
      try {
        const canteen = await Canteen.create({
          name: `${hostel.name} Canteen`,
          hostel: hostel._id,
          provider: canteenProvider._id,
          deliveryCharge: 30,
          isActive: true,
          description: `Canteen at ${hostel.name}`,
          subscriptionPlans: [],
          menuItems: [],
        });
        
        // Update hostel with canteen reference
        await Hostel.findByIdAndUpdate(hostel._id, {
          canteen: canteen._id,
          hasCanteen: true,
        });
        
        console.log(`✓ Created canteen for ${hostel.name}`);
      } catch (error) {
        console.error(`✗ Error creating canteen for ${hostel.name}:`, error.message);
      }
    }
    
    console.log('\n✅ All canteens created successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });

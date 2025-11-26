require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Contract = require('./models/Contract');

const updatePaymentStatus = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Update all contracts that have a paymentId but no paymentStatus
    const result = await Contract.updateMany(
      { 
        paymentId: { $exists: true, $ne: null },
        $or: [
          { paymentStatus: { $exists: false } },
          { paymentStatus: null }
        ]
      },
      { 
        $set: { paymentStatus: 'paid' } 
      }
    );

    console.log(`✓ Updated ${result.modifiedCount} contracts with payment status`);

    // List all contracts with their payment status
    const contracts = await Contract.find({})
      .select('contractNumber tenant paymentId orderId paymentStatus status')
      .populate('tenant', 'name email');

    console.log('\n📋 All Contracts:');
    contracts.forEach(contract => {
      console.log(`  - ${contract.contractNumber} | Tenant: ${contract.tenant?.name || 'N/A'} | Payment: ${contract.paymentStatus || 'N/A'} | Status: ${contract.status}`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

updatePaymentStatus();

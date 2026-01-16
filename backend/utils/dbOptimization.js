// Database Query Optimization Helpers

import mongoose from 'mongoose';

/**
 * Add lean() to queries for read-only operations (30-40% faster)
 * @param {Query} query - Mongoose query
 * @returns Query with lean()
 */
export const optimizeReadQuery = (query) => {
  return query.lean();
};

/**
 * Create indexes for frequently queried fields
 * Call this after model definitions
 */
export const createIndexes = async () => {
  try {
    const Hostel = mongoose.model('Hostel');
    const User = mongoose.model('User');
    const Room = mongoose.model('Room');
    const Order = mongoose.model('Order');
    const Contract = mongoose.model('Contract');
    const Canteen = mongoose.model('Canteen');

    // Hostel indexes
    await Hostel.collection.createIndex({ 'address.city': 1, hostelType: 1 });
    await Hostel.collection.createIndex({ owner: 1, isActive: 1 });
    await Hostel.collection.createIndex({ verificationStatus: 1 });
    await Hostel.collection.createIndex({ 'location.coordinates': '2dsphere' });

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ phoneNumber: 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ role: 1 });

    // Room indexes
    await Room.collection.createIndex({ hostel: 1, isAvailable: 1 });
    await Room.collection.createIndex({ hostel: 1, roomNumber: 1 });

    // Order indexes
    await Order.collection.createIndex({ user: 1, createdAt: -1 });
    await Order.collection.createIndex({ canteen: 1, status: 1 });
    await Order.collection.createIndex({ razorpay_order_id: 1 });

    // Contract indexes
    await Contract.collection.createIndex({ tenant: 1, status: 1 });
    await Contract.collection.createIndex({ owner: 1, status: 1 });
    await Contract.collection.createIndex({ room: 1 });

    // Canteen indexes
    await Canteen.collection.createIndex({ owner: 1 });
    await Canteen.collection.createIndex({ associatedHostels: 1 });

    console.log('βœ… Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  }
};

/**
 * Optimize pagination queries
 * @param {Model} Model - Mongoose model
 * @param {Object} query - Query filter
 * @param {Object} options - Pagination options {page, limit, sort, select}
 * @returns {Promise} Paginated results
 */
export const paginateQuery = async (Model, query = {}, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };
  const select = options.select || '';

  const [results, total] = await Promise.all([
    Model.find(query)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Model.countDocuments(query),
  ]);

  return {
    data: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Batch operations helper - reduces database round trips
 * @param {Array} operations - Array of operations
 * @returns {Promise} Results
 */
export const batchOperations = async (operations) => {
  return Promise.all(operations);
};

/**
 * Aggregate pipeline helper for complex queries
 * @param {Model} Model - Mongoose model
 * @param {Array} pipeline - Aggregation pipeline
 * @returns {Promise} Aggregated results
 */
export const aggregateQuery = async (Model, pipeline) => {
  return Model.aggregate(pipeline).allowDiskUse(true);
};

export default {
  optimizeReadQuery,
  createIndexes,
  paginateQuery,
  batchOperations,
  aggregateQuery,
};

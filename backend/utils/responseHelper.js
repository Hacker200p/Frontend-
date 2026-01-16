// API Response Helper - Standardize all API responses

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {*} data - Data to send in response
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  // Remove data field if null
  if (data === null) {
    delete response.data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {Object} errors - Validation errors or additional error details
 */
export const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  // Add errors field if provided (useful for validation errors)
  if (errors) {
    response.errors = errors;
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    response.message = 'Internal server error';
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination details
 * @param {String} message - Success message
 */
export const sendPaginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      totalItems: pagination.total,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPrevPage: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send created resource response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {String} message - Success message
 */
export const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send no content response
 * @param {Object} res - Express response object
 */
export const sendNoContent = (res) => {
  return res.status(204).send();
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 */
export const sendValidationError = (res, errors) => {
  return sendError(res, 'Validation failed', 400, errors);
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {String} resource - Name of the resource not found
 */
export const sendNotFound = (res, resource = 'Resource') => {
  return sendError(res, `${resource} not found`, 404);
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {String} message - Custom message
 */
export const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendError(res, message, 401);
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {String} message - Custom message
 */
export const sendForbidden = (res, message = 'Access forbidden') => {
  return sendError(res, message, 403);
};

/**
 * Send conflict response
 * @param {Object} res - Express response object
 * @param {String} message - Custom message
 */
export const sendConflict = (res, message = 'Resource already exists') => {
  return sendError(res, message, 409);
};

// Export all helpers as default object
export default {
  sendSuccess,
  sendError,
  sendPaginated,
  sendCreated,
  sendNoContent,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
};

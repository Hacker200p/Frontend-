// HTTP Cache Helper - Add caching headers for better performance

/**
 * Set cache headers for static/unchanging resources
 * @param {number} maxAge - Cache duration in seconds
 */
export const setCacheHeaders = (maxAge = 3600) => {
  return (req, res, next) => {
    // Public cache for GET requests only
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${maxAge}`);
    }
    next();
  };
};

/**
 * Disable caching for sensitive/dynamic data
 */
export const noCacheHeaders = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  next();
};

/**
 * Set ETag headers for conditional requests
 */
export const setETagHeaders = (req, res, next) => {
  res.set('ETag', `"${Date.now()}"`);
  next();
};

/**
 * Cache strategy for different resource types
 */
export const cacheStrategies = {
  // Images, fonts, static assets - 1 year
  static: setCacheHeaders(31536000),
  
  // API data that changes infrequently - 5 minutes
  semiStatic: setCacheHeaders(300),
  
  // API data that changes frequently - 30 seconds
  dynamic: setCacheHeaders(30),
  
  // Never cache - auth, user data
  noCache: noCacheHeaders,
};

export default {
  setCacheHeaders,
  noCacheHeaders,
  setETagHeaders,
  cacheStrategies,
};

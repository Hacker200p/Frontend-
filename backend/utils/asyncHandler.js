// Async Handler Wrapper - Eliminates try-catch boilerplate in controllers

/**
 * Wraps async route handlers to catch errors and pass them to error middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Instead of:
 * export const getUser = async (req, res, next) => {
 *   try {
 *     const user = await User.findById(req.params.id);
 *     res.json({ success: true, data: user });
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 * 
 * // Use:
 * export const getUser = asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *   res.json({ success: true, data: user });
 * });
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;

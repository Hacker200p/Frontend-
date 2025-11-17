const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  // Access token - short lived (15 minutes)
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

  // Refresh token - long lived (7 days)
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  return { accessToken, refreshToken };
};

module.exports = generateToken;

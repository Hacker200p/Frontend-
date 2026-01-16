// Logger utility with colored output and log levels
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? 
  (process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG);

const formatTimestamp = () => {
  return new Date().toISOString();
};

const logger = {
  error: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(
        `${colors.red}[ERROR]${colors.reset}`,
        `${colors.dim}${formatTimestamp()}${colors.reset}`,
        ...args
      );
    }
  },

  warn: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(
        `${colors.yellow}[WARN]${colors.reset}`,
        `${colors.dim}${formatTimestamp()}${colors.reset}`,
        ...args
      );
    }
  },

  info: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(
        `${colors.blue}[INFO]${colors.reset}`,
        `${colors.dim}${formatTimestamp()}${colors.reset}`,
        ...args
      );
    }
  },

  debug: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(
        `${colors.cyan}[DEBUG]${colors.reset}`,
        `${colors.dim}${formatTimestamp()}${colors.reset}`,
        ...args
      );
    }
  },

  success: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(
        `${colors.green}[SUCCESS]${colors.reset}`,
        `${colors.dim}${formatTimestamp()}${colors.reset}`,
        ...args
      );
    }
  },

  // Special loggers for specific contexts
  db: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(
        `${colors.magenta}[DB]${colors.reset}`,
        `${colors.dim}${formatTimestamp()}${colors.reset}`,
        ...args
      );
    }
  },

  auth: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(
        `${colors.cyan}[AUTH]${colors.reset}`,
        `${colors.dim}${formatTimestamp()}${colors.reset}`,
        ...args
      );
    }
  },

  payment: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(
        `${colors.yellow}[PAYMENT]${colors.reset}`,
        `${colors.dim}${formatTimestamp()}${colors.reset}`,
        ...args
      );
    }
  },

  socket: (...args) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(
        `${colors.magenta}[SOCKET]${colors.reset}`,
        `${colors.dim}${formatTimestamp()}${colors.reset}`,
        ...args
      );
    }
  },
};

export default logger;

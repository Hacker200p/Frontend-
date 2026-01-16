// Graceful Shutdown Handler - Ensures clean server shutdown

class GracefulShutdown {
  constructor(server, options = {}) {
    this.server = server;
    this.timeout = options.timeout || 30000; // 30 seconds
    this.onShutdown = options.onShutdown || (() => {});
    this.isShuttingDown = false;
  }

  init() {
    // Handle shutdown signals
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      this.shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't shut down for unhandled rejections, just log
    });

    console.log('🛡️  Graceful shutdown handler initialized');
  }

  async shutdown(signal) {
    if (this.isShuttingDown) {
      console.log('⏳ Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);

    // Stop accepting new connections
    this.server.close((err) => {
      if (err) {
        console.error('❌ Error during server close:', err);
        process.exit(1);
      }
      console.log('✅ Server closed successfully');
    });

    // Set forced shutdown timeout
    const forceTimeout = setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, this.timeout);

    try {
      // Run custom shutdown logic
      await this.onShutdown();
      
      clearTimeout(forceTimeout);
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      clearTimeout(forceTimeout);
      process.exit(1);
    }
  }

  middleware() {
    return (req, res, next) => {
      if (this.isShuttingDown) {
        res.set('Connection', 'close');
        return res.status(503).json({
          success: false,
          message: 'Server is shutting down',
          error: 'SERVICE_UNAVAILABLE',
        });
      }
      next();
    };
  }
}

export default GracefulShutdown;

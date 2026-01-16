// Process Health Monitor - Prevents server crashes from resource exhaustion

import os from 'os';
import process from 'process';

class HealthMonitor {
  constructor(options = {}) {
    this.maxMemoryPercent = options.maxMemoryPercent || 85;
    this.maxCpuPercent = options.maxCpuPercent || 90;
    this.checkInterval = options.checkInterval || 10000; // 10 seconds
    this.shutdownOnCritical = options.shutdownOnCritical !== false;
    this.onWarning = options.onWarning || console.warn;
    this.onCritical = options.onCritical || console.error;
    
    this.isMonitoring = false;
    this.intervalId = null;
    this.lastCpuUsage = process.cpuUsage();
    this.lastCheck = Date.now();
  }

  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Health Monitor started');
    
    this.intervalId = setInterval(() => {
      this.checkHealth();
    }, this.checkInterval);

    // Also check on startup
    setTimeout(() => this.checkHealth(), 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
    console.log('🛑 Health Monitor stopped');
  }

  checkHealth() {
    const memory = this.getMemoryUsage();
    const cpu = this.getCpuUsage();
    const uptime = process.uptime();

    // Log health stats
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Health: Memory ${memory.percent.toFixed(1)}% | CPU ${cpu.percent.toFixed(1)}% | Uptime ${Math.floor(uptime)}s`);
    }

    // Check memory
    if (memory.percent > this.maxMemoryPercent) {
      const message = `⚠️  HIGH MEMORY USAGE: ${memory.percent.toFixed(1)}% (${(memory.used / 1024 / 1024).toFixed(0)}MB used)`;
      
      if (memory.percent > 95) {
        this.onCritical(message);
        this.triggerGarbageCollection();
        
        if (this.shutdownOnCritical && memory.percent > 98) {
          this.gracefulShutdown('Critical memory exhaustion');
        }
      } else {
        this.onWarning(message);
        this.triggerGarbageCollection();
      }
    }

    // Check CPU
    if (cpu.percent > this.maxCpuPercent) {
      const message = `⚠️  HIGH CPU USAGE: ${cpu.percent.toFixed(1)}%`;
      
      if (cpu.percent > 95) {
        this.onCritical(message);
      } else {
        this.onWarning(message);
      }
    }

    return { memory, cpu, uptime, healthy: memory.percent < this.maxMemoryPercent && cpu.percent < this.maxCpuPercent };
  }

  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const processMemory = process.memoryUsage();

    return {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      percent: (usedMemory / totalMemory) * 100,
      process: {
        rss: processMemory.rss,
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        external: processMemory.external,
      }
    };
  }

  getCpuUsage() {
    const currentUsage = process.cpuUsage(this.lastCpuUsage);
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastCheck;

    // Calculate CPU percentage
    const totalMicroseconds = (currentUsage.user + currentUsage.system);
    const totalMilliseconds = timeDiff * 1000;
    const cpuPercent = (totalMicroseconds / totalMilliseconds) * 100;

    this.lastCpuUsage = process.cpuUsage();
    this.lastCheck = currentTime;

    return {
      user: currentUsage.user,
      system: currentUsage.system,
      percent: Math.min(cpuPercent, 100), // Cap at 100%
    };
  }

  triggerGarbageCollection() {
    if (global.gc) {
      try {
        global.gc();
        console.log('🗑️  Garbage collection triggered');
      } catch (e) {
        console.error('Failed to trigger garbage collection:', e);
      }
    }
  }

  gracefulShutdown(reason) {
    console.error(`🚨 CRITICAL: Initiating graceful shutdown - ${reason}`);
    
    // Give some time for current requests to complete
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }

  getStatus() {
    const health = this.checkHealth();
    return {
      status: health.healthy ? 'healthy' : 'degraded',
      checks: {
        memory: health.memory.percent < this.maxMemoryPercent,
        cpu: health.cpu.percent < this.maxCpuPercent,
      },
      metrics: {
        memory: `${health.memory.percent.toFixed(1)}%`,
        cpu: `${health.cpu.percent.toFixed(1)}%`,
        uptime: `${Math.floor(health.uptime)}s`,
      }
    };
  }
}

export default HealthMonitor;

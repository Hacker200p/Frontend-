// Offline Support and Request Queue

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.requestQueue = [];
    this.listeners = new Set();
    
    this.init();
  }

  init() {
    // Listen to online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Check connection periodically
    setInterval(() => this.checkConnection(), 30000);
  }

  handleOnline() {
    console.log('βœ… Back online - processing queued requests');
    this.isOnline = true;
    this.notifyListeners('online');
    this.processQueue();
  }

  handleOffline() {
    console.log('❌ Gone offline');
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  async checkConnection() {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      if (!this.isOnline && response.ok) {
        this.handleOnline();
      }
    } catch (error) {
      if (this.isOnline) {
        this.handleOffline();
      }
    }
  }

  queueRequest(request) {
    if (this.requestQueue.length >= 50) {
      console.warn('Request queue full - removing oldest request');
      this.requestQueue.shift();
    }
    
    this.requestQueue.push({
      ...request,
      timestamp: Date.now(),
    });
    
    console.log(`📦 Request queued (${this.requestQueue.length} pending)`);
  }

  async processQueue() {
    if (this.requestQueue.length === 0) return;
    
    console.log(`Processing ${this.requestQueue.length} queued requests...`);
    
    const queue = [...this.requestQueue];
    this.requestQueue = [];
    
    for (const item of queue) {
      try {
        await item.execute();
      } catch (error) {
        console.error('Failed to process queued request:', error);
        // Re-queue if still offline
        if (!this.isOnline) {
          this.queueRequest(item);
        }
      }
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(status) {
    this.listeners.forEach(callback => callback(status));
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      queueSize: this.requestQueue.length,
    };
  }
}

// Create singleton
export const offlineManager = new OfflineManager();

// React hook for offline status
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(offlineManager.isOnline);
  
  React.useEffect(() => {
    const unsubscribe = offlineManager.subscribe((status) => {
      setIsOnline(status === 'online');
    });
    
    return unsubscribe;
  }, []);
  
  return isOnline;
};

export default offlineManager;

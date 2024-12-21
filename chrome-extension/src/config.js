// Configuration for the extension
export const config = {
    // API endpoint
    API_ENDPOINT: 'http://localhost:5001',
    
    // Celery settings
    celery: {
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 2000,
        taskTimeout: 300000, // 5 minutes
        healthCheckInterval: 60000, // 1 minute
    },
    
    // Default speech settings
    speech: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        voice: null
    }
};

// Configuration for the extension
export const config = {
    // Celery API endpoints
    celery: {
        // Get the API endpoint from environment or use a default
        apiEndpoint: process.env.CELERY_API_ENDPOINT || 'http://localhost:5000/api',
        
        // API settings
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 2000,
        
        // Endpoint paths
        paths: {
            processText: '/process_text',
            status: '/status',
            health: '/health',
            cancel: '/cancel_task'
        }
    },
    
    // Default speech settings
    speech: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        preferredLanguage: 'en'
    },
    
    // Logging settings
    logging: {
        level: process.env.LOG_LEVEL || 'debug', // 'debug', 'info', 'warn', 'error'
        maxStoredLogs: 1000,
        enableConsole: true,
        enableStorage: true
    }
};

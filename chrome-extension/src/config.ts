// Configuration for the Chrome extension

interface Config {
    API_ENDPOINT: string;
    celery: {
        timeout: number;
        pollInterval: number;
        maxRetries: number;
    };
}

export const config: Config = {
    API_ENDPOINT: 'http://localhost:5001', // Default local development server
    celery: {
        timeout: 30000, // 30 seconds
        pollInterval: 1000, // 1 second
        maxRetries: 3
    }
};

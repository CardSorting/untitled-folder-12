import { createLogger } from './logger';
import { config } from '../config';

export class CeleryClient {
    constructor() {
        this.logger = createLogger('CeleryClient');
        this.baseUrl = config.API_ENDPOINT;
        this.config = config.celery;
        
        this.logger.info('CeleryClient initialized', {
            baseUrl: this.baseUrl,
            timeout: this.config.timeout
        });
    }

    async processText(text) {
        this.logger.debug('Processing text with Celery', { 
            textLength: text.length
        });

        try {
            const response = await fetch(`${this.baseUrl}/process_text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text }),
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
            }

            const result = await response.json();
            this.logger.success('Text processed successfully', result);
            return result;

        } catch (error) {
            this.logger.error('Error processing text:', error);
            throw error;
        }
    }

    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                signal: AbortSignal.timeout(5000) // Short timeout for health checks
            });
            return await response.json();
        } catch (error) {
            this.logger.error('Health check failed:', error);
            throw error;
        }
    }
}

export const celeryClient = new CeleryClient();

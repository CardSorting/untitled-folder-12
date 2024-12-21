import { createLogger } from './logger';
import { config } from '../config';

export class CeleryClient {
    constructor() {
        this.logger = createLogger('CeleryClient');
        this.config = config.celery;
        this.baseUrl = this.config.apiEndpoint;
        
        this.logger.info('CeleryClient initialized', {
            baseUrl: this.baseUrl,
            timeout: this.config.timeout
        });
    }

    getEndpoint(path) {
        return `${this.baseUrl}${this.config.paths[path]}`;
    }

    async processText(text) {
        this.logger.debug('Processing text with Celery', { 
            textLength: text.length,
            endpoint: this.getEndpoint('processText')
        });

        let attempts = 0;

        while (attempts < this.config.retryAttempts) {
            try {
                const response = await fetch(this.getEndpoint('processText'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text }),
                    signal: AbortSignal.timeout(this.config.timeout)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                this.logger.success('Text processed successfully', result);
                return result;
            } catch (error) {
                attempts++;
                this.logger.warn(`Attempt ${attempts} failed`, {
                    error: error.message
                });

                // If we still have retries, wait before trying again
                if (attempts < this.config.retryAttempts) {
                    const delay = this.config.retryDelay * Math.pow(2, attempts - 1);
                    this.logger.info(`Retrying in ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    this.logger.error('All attempts failed', error);
                    throw error;
                }
            }
        }
    }

    async checkStatus(taskId) {
        this.logger.debug('Checking task status', { 
            taskId,
            endpoint: this.getEndpoint('status')
        });
        
        try {
            const response = await fetch(`${this.getEndpoint('status')}/${taskId}`, {
                method: 'GET',
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.logger.debug('Task status received', result);
            return result;
        } catch (error) {
            this.logger.error('Failed to check task status', error);
            throw error;
        }
    }

    async cancelTask(taskId) {
        this.logger.debug('Canceling task', { 
            taskId,
            endpoint: this.getEndpoint('cancel')
        });
        
        try {
            const response = await fetch(`${this.getEndpoint('cancel')}/${taskId}`, {
                method: 'POST',
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.logger.success('Task canceled successfully', result);
            return result;
        } catch (error) {
            this.logger.error('Failed to cancel task', error);
            throw error;
        }
    }

    async healthCheck() {
        this.logger.debug('Checking API health', {
            endpoint: this.getEndpoint('health')
        });

        try {
            const response = await fetch(this.getEndpoint('health'), {
                signal: AbortSignal.timeout(5000) // Short timeout for health checks
            });
            
            const result = {
                status: response.ok ? 'healthy' : 'unhealthy',
                statusCode: response.status
            };

            if (response.ok) {
                const health = await response.json();
                result.details = health;
            }

            this.logger.debug('Health check result', result);
            return result;
        } catch (error) {
            const result = {
                status: 'unhealthy',
                error: error.message
            };
            this.logger.error('Health check failed', result);
            return result;
        }
    }
}

export const celeryClient = new CeleryClient();

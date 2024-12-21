// Celery client for handling text processing tasks
import { createLogger } from './logger';
import { config } from '../config';

export class CeleryClient {
    constructor(baseUrl = config.API_ENDPOINT) {
        this.logger = createLogger('CeleryClient');
        this.baseUrl = baseUrl;
        this.taskEndpoint = `${this.baseUrl}/process_text`;
        this.statusEndpoint = `${this.baseUrl}/task_status`;
        this.config = config.celery;
        
        this.logger.info('CeleryClient initialized', {
            baseUrl: this.baseUrl,
            timeout: this.config.timeout
        });
    }

    async processText(text, options = {}) {
        this.logger.debug('Processing text with Celery', { 
            textLength: text.length
        });

        try {
            const response = await fetch(this.taskEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    language: options.language || 'en',
                    rate: options.rate || 1.0,
                    pitch: options.pitch || 1.0,
                    volume: options.volume || 1.0,
                    emotionalContext: options.emotionalContext || {},
                    textStructure: options.textStructure || {}
                }),
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            this.logger.success('Text processed successfully', data);
            return {
                taskId: data.task_id,
                status: 'PENDING'
            };
        } catch (error) {
            this.logger.error('Error processing text:', error);
            throw error;
        }
    }

    async checkTaskStatus(taskId) {
        try {
            const response = await fetch(`${this.statusEndpoint}/${taskId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                taskId,
                status: data.status,
                result: data.result,
                error: data.error
            };
        } catch (error) {
            this.logger.error('Error checking task status:', error);
            throw error;
        }
    }

    async pollTaskStatus(taskId, interval = 1000) {
        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    const status = await this.checkTaskStatus(taskId);
                    if (status.status === 'SUCCESS') {
                        resolve(status.result);
                    } else if (status.status === 'FAILURE') {
                        reject(new Error(status.error || 'Task failed'));
                    } else {
                        setTimeout(poll, interval);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            poll();
        });
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

// Celery client for handling text processing tasks
import { createLogger, Logger } from './logger';
import { config } from '../config';

interface ProcessOptions {
    language?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    emotionalContext?: Record<string, any>;
    textStructure?: Record<string, any>;
}

interface TaskResponse {
    task_id: string;
    status?: string;
}

interface TaskStatus {
    taskId: string;
    status: string;
    result?: any;
    error?: string;
}

interface HealthCheckResponse {
    status: string;
    message?: string;
}

export class CeleryClient {
    private logger: Logger;
    private baseUrl: string;
    private taskEndpoint: string;
    private statusEndpoint: string;
    private config: {
        timeout: number;
        [key: string]: any;
    };

    constructor(baseUrl: string = config.API_ENDPOINT) {
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

    public async processText(text: string, options: ProcessOptions = {}): Promise<TaskStatus> {
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

            const data = await response.json() as TaskResponse;
            this.logger.success('Text processed successfully', data);
            return {
                taskId: data.task_id,
                status: 'PENDING'
            };
        } catch (error) {
            this.logger.error('Error processing text:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }

    public async checkTaskStatus(taskId: string): Promise<TaskStatus> {
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
            this.logger.error('Error checking task status:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }

    public async pollTaskStatus(taskId: string, interval: number = 1000): Promise<any> {
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

    public async checkHealth(): Promise<HealthCheckResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                signal: AbortSignal.timeout(5000) // Short timeout for health checks
            });
            return await response.json() as HealthCheckResponse;
        } catch (error) {
            this.logger.error('Health check failed:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }

    public async cancelTask(taskId: string): Promise<void> {
        try {
            const response = await fetch(`${this.statusEndpoint}/${taskId}/cancel`, {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error(`Failed to cancel task: ${taskId}`);
            }
        } catch (error) {
            this.logger.error('Error canceling task:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
}

// Export singleton instance
export const celeryClient = new CeleryClient();

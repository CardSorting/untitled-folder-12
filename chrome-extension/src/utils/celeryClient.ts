// Celery client for handling text processing tasks
import { createLogger } from './logger';
import { config } from '../config';
import { CeleryTask, CeleryTaskResult, CeleryTaskStatus, HealthCheckResponse, TaskResponse } from '../types/celery';
import { LogContext } from './logger';

interface ProcessOptions extends LogContext {
    language?: string;
    voice?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    emotionalContext?: Record<string, any>;
    textStructure?: Record<string, any>;
    [key: string]: any;
}

const logger = createLogger('CeleryClient');

export class CeleryClient {
    private readonly baseUrl: string;
    private readonly taskQueue: Map<string, CeleryTask>;
    private readonly pollInterval: number;
    private readonly maxRetries: number;

    constructor(baseUrl: string = config.API_ENDPOINT, pollInterval = 1000, maxRetries = 3) {
        this.baseUrl = baseUrl;
        this.taskQueue = new Map();
        this.pollInterval = pollInterval;
        this.maxRetries = maxRetries;
    }

    async processText(text: string, options: ProcessOptions = {}): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}${config.endpoints.processText}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    language: options.language || 'en-US',
                    voice: options.voice,
                    rate: options.rate,
                    pitch: options.pitch,
                    volume: options.volume,
                    emotionalContext: options.emotionalContext || {},
                    textStructure: options.textStructure || {}
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to process text: ${response.statusText}`);
            }

            const data: TaskResponse = await response.json();
            const taskId = data.task_id;

            if (!taskId) {
                throw new Error('No task ID returned from server');
            }

            this.taskQueue.set(taskId, {
                id: taskId,
                name: 'processText',
                args: [text, options],
                status: 'PENDING',
                result: null,
                error: null,
                retries: 0,
            });

            logger.info('Text processing task submitted', { taskId });
            return taskId;
        } catch (error) {
            logger.error('Error processing text', { error: String(error) });
            throw error;
        }
    }

    async getTaskResult(taskId: string): Promise<CeleryTaskStatus> {
        try {
            const response = await fetch(`${this.baseUrl}${config.endpoints.taskStatus}/${taskId}`);
            if (!response.ok) {
                throw new Error(`Failed to get task status: ${response.statusText}`);
            }

            const data: TaskResponse = await response.json();
            return {
                taskId,
                status: data.status,
                result: data.result,
                error: data.error || undefined,
                message: data.message
            };
        } catch (error) {
            logger.error('Error getting task result', { taskId, error: String(error) });
            throw error;
        }
    }

    async pollTaskStatus(taskId: string): Promise<CeleryTaskStatus> {
        const task = this.taskQueue.get(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found in queue`);
        }

        try {
            const result = await this.getTaskResult(taskId);
            task.status = result.status;
            task.result = result.result;
            task.error = result.error || null;

            if (result.status === 'SUCCESS') {
                logger.info('Task completed successfully', { 
                    taskId, 
                    result: result.result ? JSON.stringify(result.result) : null 
                });
                this.taskQueue.delete(taskId);
            } else if (result.status === 'FAILURE') {
                logger.error('Task failed', { 
                    taskId, 
                    error: result.error || 'Unknown error'
                });
                this.taskQueue.delete(taskId);
            } else {
                logger.info('Task status updated', { 
                    taskId, 
                    status: result.status 
                });
            }

            return result;
        } catch (error) {
            task.retries++;
            if (task.retries >= this.maxRetries) {
                logger.error('Max retries reached', { 
                    taskId, 
                    error: error instanceof Error ? error.message : String(error),
                    retries: task.retries
                });
                this.taskQueue.delete(taskId);
                throw error;
            }
            logger.warn('Error polling task status, retrying', { 
                taskId, 
                retries: task.retries,
                error: error instanceof Error ? error.message : String(error)
            });
            return { 
                taskId, 
                status: 'PENDING', 
                result: null, 
                error: undefined 
            };
        }
    }

    getQueuedTasks(): CeleryTask[] {
        return Array.from(this.taskQueue.values());
    }

    async checkHealth(): Promise<HealthCheckResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                signal: AbortSignal.timeout(5000) // Short timeout for health checks
            });
            return await response.json() as HealthCheckResponse;
        } catch (error) {
            logger.error('Health check failed', { 
                error: error instanceof Error ? error.message : String(error) 
            });
            throw error;
        }
    }

    async cancelTask(taskId: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}${config.endpoints.taskStatus}/${taskId}/cancel`, {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error(`Failed to cancel task: ${response.statusText}`);
            }
        } catch (error) {
            logger.error('Error canceling task', { 
                taskId,
                error: error instanceof Error ? error.message : String(error) 
            });
            throw error;
        }
    }
}

// Export singleton instance
export const celeryClient = new CeleryClient();

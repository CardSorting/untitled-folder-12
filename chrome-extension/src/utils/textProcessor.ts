import { createLogger } from './logger';
import { CeleryClient } from './celeryClient';
import { config } from '../config';
import { LogContext } from './logger';

interface ProcessingResult {
    taskId: string;
    status: string;
    result?: any;
    error?: string;
}

interface ProcessingOptions extends LogContext {
    language?: string;
    voice?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    emotionalContext?: Record<string, any>;
    textStructure?: Record<string, any>;
    [key: string]: any;
}

const logger = createLogger('TextProcessor');
const celeryClient = new CeleryClient(config.API_ENDPOINT);

class TextProcessingManager {
    private static instance: TextProcessingManager;
    private activeTasks: Map<string, ProcessingResult>;
    private isInitialized: boolean;

    private constructor() {
        this.activeTasks = new Map();
        this.isInitialized = false;
    }

    public static getInstance(): TextProcessingManager {
        if (!TextProcessingManager.instance) {
            TextProcessingManager.instance = new TextProcessingManager();
        }
        return TextProcessingManager.instance;
    }

    public async setup(): Promise<void> {
        try {
            // Check if Celery API is available
            const response = await fetch(`${config.API_ENDPOINT}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to connect to Celery API: ${response.statusText}`);
            }

            this.isInitialized = true;
            logger.info('Text processor initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize text processor', { error: error as Error });
            throw error;
        }
    }

    public async processText(text: string, options: ProcessingOptions = {}): Promise<ProcessingResult> {
        if (!this.isInitialized) {
            throw new Error('Text processor is not initialized');
        }

        try {
            logger.debug('Processing text:', { length: text.length, options });

            const taskId = await celeryClient.processText(text, options);
            const result = await celeryClient.pollTaskStatus(taskId);
            
            logger.info('Text processing result', { 
                taskId, 
                status: result.status,
                error: result.error || undefined
            });

            this.activeTasks.set(result.taskId, result);
            return {
                taskId: result.taskId,
                status: result.status,
                result: result.result,
                error: result.error
            };
        } catch (error) {
            logger.error('Error processing text', { 
                error: error instanceof Error ? error.message : String(error) 
            });
            throw error;
        }
    }

    public async checkTaskStatus(taskId: string): Promise<ProcessingResult> {
        if (!this.isInitialized) {
            throw new Error('Text processor is not initialized');
        }

        try {
            const status = await celeryClient.pollTaskStatus(taskId);
            this.activeTasks.set(taskId, status);
            return status;
        } catch (error) {
            logger.error('Error checking task status:', {
                taskId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    public async cancelTask(taskId: string): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('Text processor is not initialized');
        }

        try {
            await celeryClient.cancelTask(taskId);
            this.activeTasks.delete(taskId);
            logger.info('Task cancelled:', { taskId });
        } catch (error) {
            logger.error('Error cancelling task:', {
                taskId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    public getActiveTask(taskId: string): ProcessingResult | undefined {
        return this.activeTasks.get(taskId);
    }

    public getAllActiveTasks(): ProcessingResult[] {
        return Array.from(this.activeTasks.values());
    }

    public cleanupTask(taskId: string): void {
        this.activeTasks.delete(taskId);
        logger.debug('Task cleaned up:', { taskId });
    }
}

export const textProcessingManager = TextProcessingManager.getInstance();

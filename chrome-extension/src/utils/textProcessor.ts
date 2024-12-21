import { createLogger } from './logger';
import { celeryClient } from './celeryClient';
import { initManager } from './initUtils';
import { TextProcessingOptions, ProcessingResult } from '../types/settings';

const logger = createLogger('TextProcessor');

class TextProcessingManager {
    private static instance: TextProcessingManager;
    private activeTasks: Map<string, ProcessingResult>;

    private constructor() {
        this.activeTasks = new Map();
    }

    public static getInstance(): TextProcessingManager {
        if (!TextProcessingManager.instance) {
            TextProcessingManager.instance = new TextProcessingManager();
        }
        return TextProcessingManager.instance;
    }

    public async processText(text: string, options: TextProcessingOptions = {}): Promise<ProcessingResult> {
        try {
            logger.debug('Processing text:', { length: text.length, options });

            const result = await celeryClient.processText(text, {
                language: options.language || 'en',
                rate: options.rate || 1.0,
                pitch: options.pitch || 1.0,
                volume: options.volume || 1.0
            });

            this.activeTasks.set(result.taskId, result);
            logger.info('Text processing initiated:', result);

            return result;
        } catch (error) {
            logger.error('Error processing text:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                debug: initManager.debugInfo()
            });
            throw error;
        }
    }

    public async checkTaskStatus(taskId: string): Promise<ProcessingResult> {
        try {
            const status = await celeryClient.checkTaskStatus(taskId);
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

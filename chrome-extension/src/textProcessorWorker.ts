// Text processor worker for handling speech synthesis
import { createLogger, Logger } from './utils/logger';
import { celeryClient } from './utils/celeryClient';

interface ProcessOptions {
    rate?: number;
    pitch?: number;
    volume?: number;
    language?: string;
    emotionalContext?: Record<string, any>;
    textStructure?: Record<string, any>;
}

interface TaskResult {
    taskId: string;
    status: string;
    result?: any;
    error?: string;
}

class TextProcessorWorker {
    private static instance: TextProcessorWorker;
    private logger: Logger;
    private currentOptions: ProcessOptions;

    private constructor() {
        this.logger = createLogger('TextProcessor');
        this.currentOptions = {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
        };
    }

    public static getInstance(): TextProcessorWorker {
        if (!TextProcessorWorker.instance) {
            TextProcessorWorker.instance = new TextProcessorWorker();
        }
        return TextProcessorWorker.instance;
    }

    public async processText(text: string, options: ProcessOptions = {}): Promise<TaskResult> {
        try {
            // Merge options with defaults
            const processOptions = {
                ...this.currentOptions,
                ...options
            };

            // Log the processing request
            this.logger.debug('Processing text', {
                textLength: text.length,
                options: processOptions
            });

            // Submit the task to Celery
            const { taskId } = await celeryClient.processText(text, processOptions);
            return {
                taskId,
                status: 'PENDING'
            };
        } catch (error) {
            this.logger.error('Error processing text:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }

    public async pollTaskStatus(taskId: string): Promise<any> {
        try {
            return await celeryClient.pollTaskStatus(taskId);
        } catch (error) {
            this.logger.error('Error polling task status:', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }

    public updateOptions(options: Partial<ProcessOptions>): void {
        this.currentOptions = {
            ...this.currentOptions,
            ...options
        };
        this.logger.debug('Updated processing options:', this.currentOptions);
    }

    public resetOptions(): void {
        this.currentOptions = {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
        };
        this.logger.debug('Reset processing options to defaults');
    }
}

// Export singleton instance
export const textProcessorWorker = TextProcessorWorker.getInstance();

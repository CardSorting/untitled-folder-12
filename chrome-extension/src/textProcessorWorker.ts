// Text processor worker for handling speech synthesis
import { createLogger } from './utils/logger';
import { CeleryClient } from './utils/celeryClient';
import { config } from './config';
import { LogContext } from './utils/logger';

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

interface ProcessResult {
    taskId: string;
    status: string;
    result?: any;
    error?: string;
}

const logger = createLogger('TextProcessorWorker');

class TextProcessorWorker {
    private static instance: TextProcessorWorker;
    private readonly celeryClient: CeleryClient;
    private readonly logger = createLogger('TextProcessorWorker');
    private currentOptions: ProcessOptions;

    private constructor() {
        this.celeryClient = new CeleryClient(config.API_ENDPOINT);
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

    public async processText(text: string, options: ProcessOptions = {}): Promise<ProcessResult> {
        try {
            // Merge options with defaults
            const processOptions = {
                language: options.language || 'en-US',
                rate: options.rate || 1.0,
                pitch: options.pitch || 1.0,
                volume: options.volume || 1.0,
                ...options
            };

            // Merge options with current options
            const mergedOptions = {
                ...this.currentOptions,
                ...processOptions
            };

            this.logger.info('Processing text', { 
                length: text.length, 
                options: mergedOptions 
            });

            // Submit the task to Celery
            const taskId = await this.celeryClient.processText(text, mergedOptions);
            const result = await this.celeryClient.pollTaskStatus(taskId);
            
            this.logger.info('Text processing result', { 
                taskId, 
                status: result.status,
                error: result.error || undefined
            });

            return {
                taskId: result.taskId,
                status: result.status,
                result: result.result,
                error: result.error
            };
        } catch (error) {
            this.logger.error('Error processing text', { 
                error: error instanceof Error ? error.message : String(error) 
            });
            throw error;
        }
    }

    public async pollTaskStatus(taskId: string): Promise<any> {
        try {
            return await this.celeryClient.pollTaskStatus(taskId);
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

const textProcessor = TextProcessorWorker.getInstance();

self.onmessage = async (event: MessageEvent) => {
    const { text, options = {} } = event.data;

    try {
        logger.info('Processing text in worker', { length: text.length });

        const result = await textProcessor.processText(text, options);
        self.postMessage({
            type: 'success',
            result
        });
    } catch (error) {
        logger.error('Error processing text in worker', { 
            error: error instanceof Error ? error.message : String(error) 
        });
        self.postMessage({
            type: 'error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

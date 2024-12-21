import { celeryClient } from './utils/celeryClient';
import { createLogger } from './utils/logger';

const logger = createLogger('TextProcessorWorker');

// Listen for messages from the main thread
onmessage = async function(e) {
    const { text, taskId } = e.data;
    
    try {
        logger.info(`Processing text for task ${taskId}`);
        
        // Send text to backend for processing
        const result = await celeryClient.processText(text);
        
        // Send the result back to the main thread
        postMessage({
            type: 'complete',
            taskId: taskId,
            result: result
        });
        
    } catch (error) {
        logger.error(`Error processing text: ${error.message}`, error);
        
        // Send error back to the main thread
        postMessage({
            type: 'error',
            taskId: taskId,
            error: error.message
        });
    }
};

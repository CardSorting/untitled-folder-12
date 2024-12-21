// Import required utilities
import { TextAnalyzer } from './utils/textAnalyzer';
import { ChunkManager } from './utils/chunkManager';
import { getLanguagePatterns } from './utils/languagePatterns';
import { TextProcessorConfig } from './utils/textProcessorConfig';
import { createLogger } from './utils/logger';

const logger = createLogger('TextProcessor');
logger.info('Text processor worker initialized');

// Initialize text processing utilities
const textAnalyzer = new TextAnalyzer();
const chunkManager = new ChunkManager();
const textProcessorConfig = new TextProcessorConfig();

// Listen for messages from the content script
self.onmessage = function(e) {
  const msgLogger = logger.createSubLogger('MessageHandler');
  msgLogger.debug('Received message', e.data);

  if (e.data.action === 'processText') {
    try {
      const processedText = processText(e.data.text);
      msgLogger.success('Text processed successfully', {
        inputLength: e.data.text.length,
        outputLength: processedText.length
      });

      self.postMessage({
        action: 'processedText',
        text: processedText
      });
    } catch (error) {
      msgLogger.error('Error processing text', error);
      self.postMessage({
        action: 'error',
        error: error.message
      });
    }
  } else {
    msgLogger.warn('Unknown action received', e.data);
  }
};

// Process the text using our utility functions
function processText(text) {
  const procLogger = logger.createSubLogger('Processor');
  procLogger.debug('Processing text', { length: text.length });
  
  try {
    // Analyze the text
    const analysis = textAnalyzer.analyzeText(text);
    
    // Get language patterns based on analysis
    const patterns = getLanguagePatterns(analysis.detectedLanguage);
    
    // Break text into manageable chunks
    const chunks = chunkManager.splitIntoChunks(text, textProcessorConfig.chunkSize);
    
    // Process each chunk according to detected patterns
    const processedChunks = chunks.map(chunk => {
      return textAnalyzer.processChunk(chunk, patterns);
    });
    
    // Combine processed chunks
    return processedChunks.join(' ');
  } catch (error) {
    procLogger.error('Error processing text', error);
    return text; // Return original text if processing fails
  }
}

logger.success('Text processor worker ready with utilities loaded');

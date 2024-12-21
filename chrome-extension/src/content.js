import { createLogger } from './utils/logger';
import { CeleryClient } from './utils/celeryClient';

const logger = createLogger('Content');
logger.info('Content script loaded');

// Initialize text-to-speech and Celery client
const speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
const celeryClient = new CeleryClient();

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const msgLogger = logger.createSubLogger('MessageHandler');
  msgLogger.debug('Received message', request);

  // Handle ping message
  if (request.action === 'ping') {
    msgLogger.debug('Received ping, sending response');
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'readText' && request.text) {
    msgLogger.info('Processing text request', {
      textLength: request.text.length,
      preview: request.text.substring(0, 50) + '...'
    });
    
    try {
      // Stop any current speech
      if (currentUtterance) {
        msgLogger.debug('Stopping current speech');
        speechSynthesis.cancel();
      }

      // Send text to Celery for processing
      msgLogger.debug('Sending text to Celery for processing');
      celeryClient.processText(request.text)
        .then(result => {
          msgLogger.success('Text processed by Celery', result);
          speakText(result.text);
        })
        .catch(error => {
          msgLogger.error('Celery processing error', error);
          // Still speak the original text if processing fails
          speakText(request.text);
        });

      // Send immediate success response
      msgLogger.success('Text sent to Celery for processing');
      sendResponse({
        success: true,
        message: 'Processing text'
      });
    } catch (error) {
      msgLogger.error('Error processing text', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  } else if (request.action !== 'ping') {
    msgLogger.warn('Invalid request received', request);
    sendResponse({
      success: false,
      error: 'Invalid request'
    });
  }
  return true; // Keep the message channel open for async response
});

// Function to speak the text
function speakText(text) {
  const speechLogger = logger.createSubLogger('Speech');
  try {
    speechLogger.info('Starting speech synthesis', {
      textLength: text.length,
      preview: text.substring(0, 50) + '...'
    });
    
    // Create and configure utterance
    currentUtterance = new SpeechSynthesisUtterance(text);

    // Set default voice (English)
    const voices = speechSynthesis.getVoices();
    speechLogger.debug('Available voices', {
      count: voices.length,
      voices: voices.map(v => ({
        name: v.name,
        lang: v.lang,
        default: v.default
      }))
    });
    
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
    if (englishVoice) {
      speechLogger.debug('Selected voice', {
        name: englishVoice.name,
        lang: englishVoice.lang
      });
      currentUtterance.voice = englishVoice;
    } else {
      speechLogger.warn('No English voice found, using default');
    }

    // Configure speech parameters
    currentUtterance.rate = 1.0;
    currentUtterance.pitch = 1.0;
    currentUtterance.volume = 1.0;

    // Add event listeners
    currentUtterance.onend = () => {
      speechLogger.success('Speech completed');
      currentUtterance = null;
    };

    currentUtterance.onerror = (event) => {
      speechLogger.error('Speech synthesis error', {
        error: event.error,
        message: event.message,
        elapsedTime: event.elapsedTime
      });
      currentUtterance = null;
    };

    // Start speaking
    speechSynthesis.speak(currentUtterance);
    speechLogger.info('Started speaking');
  } catch (error) {
    speechLogger.error('Error in speech synthesis', error);
    currentUtterance = null;
  }
}

// Initialize voices when they're loaded
speechSynthesis.onvoiceschanged = () => {
  const voices = speechSynthesis.getVoices();
  logger.debug('Available voices loaded', voices.map(v => ({
    name: v.name,
    lang: v.lang,
    default: v.default
  })));
};

logger.success('Content script initialization complete');

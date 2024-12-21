/******/ (() => { // webpackBootstrap
console.log('Content script loaded');

// Initialize text-to-speech
var speechSynthesis = window.speechSynthesis;
var currentUtterance = null;
var textProcessor = null;

// Initialize the worker
function initializeWorker() {
  try {
    var workerURL = chrome.runtime.getURL('dist/textProcessorWorker.bundle.js');
    textProcessor = new Worker(workerURL);

    // Handle messages from the worker
    textProcessor.onmessage = function (e) {
      if (e.data.action === 'processedText') {
        speakText(e.data.text);
      }
    };
    textProcessor.onerror = function (error) {
      console.error('Worker error:', error);
    };
    console.log('Worker initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize worker:', error);
    return false;
  }
}

// Initialize the worker when the content script loads
var workerInitialized = initializeWorker();

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('Received message:', request);

  // Handle ping message
  if (request.action === 'ping') {
    sendResponse({
      success: true
    });
    return true;
  }
  if (request.action === 'readText' && request.text) {
    try {
      // Stop any current speech
      if (currentUtterance) {
        speechSynthesis.cancel();
      }

      // Ensure worker is initialized
      if (!workerInitialized) {
        console.log('Reinitializing worker...');
        workerInitialized = initializeWorker();
        if (!workerInitialized) {
          throw new Error('Failed to initialize worker');
        }
      }

      // Send text to worker for processing
      textProcessor.postMessage({
        action: 'processText',
        text: request.text
      });

      // Send immediate success response
      sendResponse({
        success: true,
        message: 'Processing text'
      });
    } catch (error) {
      console.error('Error processing text:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  } else if (request.action !== 'ping') {
    sendResponse({
      success: false,
      error: 'Invalid request'
    });
  }
  return true; // Keep the message channel open for async response
});

// Function to speak the text
function speakText(text) {
  try {
    // Create and configure utterance
    currentUtterance = new SpeechSynthesisUtterance(text);

    // Set default voice (English)
    var voices = speechSynthesis.getVoices();
    var englishVoice = voices.find(function (voice) {
      return voice.lang.startsWith('en-');
    });
    if (englishVoice) {
      currentUtterance.voice = englishVoice;
    }

    // Configure speech parameters
    currentUtterance.rate = 1.0;
    currentUtterance.pitch = 1.0;
    currentUtterance.volume = 1.0;

    // Add event listeners
    currentUtterance.onend = function () {
      console.log('Speech completed');
      currentUtterance = null;
    };
    currentUtterance.onerror = function (event) {
      console.error('Speech synthesis error:', event);
      currentUtterance = null;
    };

    // Start speaking
    speechSynthesis.speak(currentUtterance);
    console.log('Started speaking');
  } catch (error) {
    console.error('Error in speech synthesis:', error);
    currentUtterance = null;
  }
}

// Initialize voices when they're loaded
speechSynthesis.onvoiceschanged = function () {
  var voices = speechSynthesis.getVoices();
  console.log('Available voices:', voices.length);
};

// Log that content script is ready
console.log('Content script initialization complete');
/******/ })()
;
//# sourceMappingURL=content.bundle.js.map
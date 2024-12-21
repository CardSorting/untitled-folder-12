import { createLogger } from './utils/logger';

const logger = createLogger('Background');

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  logger.info('Extension installed, creating context menu');
  chrome.contextMenus.create({
    id: 'readSelectedText',
    title: 'Read Selected Text',
    contexts: ['selection']
  });
});

// Ensure content script is injected
async function ensureContentScriptInjected(tabId) {
  const scriptLogger = logger.createSubLogger('ContentScript');
  try {
    // Check if content script is already injected
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    scriptLogger.success('Content script already injected');
    return true;
  } catch (error) {
    scriptLogger.warn('Content script not found, attempting injection');
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['dist/content.bundle.js']
      });
      scriptLogger.success('Content script injected successfully');
      return true;
    } catch (error) {
      scriptLogger.error('Failed to inject content script', error);
      return false;
    }
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const menuLogger = logger.createSubLogger('ContextMenu');
  
  if (info.menuItemId === 'readSelectedText' && info.selectionText) {
    menuLogger.info('Processing selected text', {
      textLength: info.selectionText.length,
      tabId: tab.id,
      tabUrl: tab.url
    });

    // Ensure content script is injected
    const isInjected = await ensureContentScriptInjected(tab.id);
    if (!isInjected) {
      menuLogger.error('Failed to ensure content script');
      showNotification('Error', 'Failed to initialize text reader');
      return;
    }

    // Send message to content script
    menuLogger.debug('Sending text to content script');
    chrome.tabs.sendMessage(tab.id, {
      action: 'readText',
      text: info.selectionText
    }, (response) => {
      // Check for runtime error first
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError;
        menuLogger.error('Runtime error in message response', error);
        showNotification('Error', 'Failed to initialize text reader: ' + error.message);
        return;
      }

      menuLogger.debug('Received response from content script', response);

      if (response?.success) {
        menuLogger.success('Text processing started successfully');
        showNotification('Success', 'Starting text-to-speech');
      } else {
        const errorMessage = response?.error || 'Failed to process text';
        menuLogger.error('Text processing failed', { error: errorMessage });
        showNotification('Error', errorMessage);
      }
    });
  }
});

// Show notification with error handling
function showNotification(title, message) {
  const notifyLogger = logger.createSubLogger('Notification');
  notifyLogger.debug('Showing notification', { title, message });
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      notifyLogger.error('Failed to show notification', chrome.runtime.lastError);
    } else {
      notifyLogger.success('Notification shown', { notificationId });
    }
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const msgLogger = logger.createSubLogger('MessageListener');
  msgLogger.debug('Received message from content script', {
    request,
    sender: {
      tab: sender.tab?.id,
      url: sender.tab?.url
    }
  });
  return true;
});

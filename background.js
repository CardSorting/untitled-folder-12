// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "readText",
    title: "Read Selected Text",
    contexts: ["selection"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error creating context menu:', chrome.runtime.lastError);
    }
  });
});

// Inject content script and send message
async function injectAndSendMessage(tabId, text) {
  try {
    // Check if we can access the tab's URL
    const tab = await chrome.tabs.get(tabId);
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      // Show notification to user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Extension Restricted',
        message: 'This extension cannot be used on browser system pages for security reasons.'
      });
      return;
    }

    try {
      await chrome.tabs.sendMessage(tabId, { action: "ping" });
      // If no error, content script is already there, send the real message
      sendTextToRead(tabId, text);
    } catch {
      // Content script not injected yet, inject it
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['dist/content.bundle.js']
      });
      // Wait a bit for the content script to initialize
      setTimeout(() => {
        sendTextToRead(tabId, text);
      }, 100);
    }
  } catch (error) {
    console.error('Error:', error);
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Error',
      message: 'Unable to process text on this page. Please try again.'
    });
  }
}

// Function to send the text to be read
function sendTextToRead(tabId, text) {
  chrome.tabs.sendMessage(
    tabId,
    { action: "readText", text: text },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
      } else if (response) {
        console.log('Message sent successfully:', response);
      }
    }
  );
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "readText" && tab?.id) {
    injectAndSendMessage(tab.id, info.selectionText);
  }
});

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'readSelectedText',
    title: 'Read Selected Text',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'readSelectedText' && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'readText',
      text: info.selectionText
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'stopSpeech') {
    chrome.tabs.sendMessage(sender.tab.id, { type: 'stopSpeech' });
  }
});

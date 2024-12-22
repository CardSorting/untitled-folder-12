// Background service worker for extension-wide functionality
chrome.runtime.onInstalled.addListener(() => {
    console.log('Text-to-Speech Reader extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "speak") {
        // Stop any current speech
        chrome.tts.stop();
        
        // Speak the new text
        chrome.tts.speak(request.text, {
            rate: 1.0,  // Normal speed
            pitch: 1.0, // Normal pitch
            volume: 1.0, // Full volume
            onEvent: function(event) {
                if (event.type === 'end' || event.type === 'error' || event.type === 'interrupted') {
                    sendResponse({ status: event.type });
                }
            }
        });
        
        // Return true to indicate we'll send a response asynchronously
        return true;
    }
});

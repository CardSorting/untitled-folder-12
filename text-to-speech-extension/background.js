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
            voiceName: request.voiceName,
            onEvent: function(event) {
                if (event.type === 'end' || event.type === 'error' || event.type === 'interrupted') {
                    chrome.tabs.sendMessage(sender.tab.id, { action: "speechEnded" });
                }
            }
        });
        sendResponse({ status: "speaking" });
        return true;
    } else if (request.action === "stop") {
        chrome.tts.stop();
        sendResponse({ status: "stopped" });
        return true;
    }
});

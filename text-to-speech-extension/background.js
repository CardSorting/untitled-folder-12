// Background service worker for extension-wide functionality
chrome.runtime.onInstalled.addListener(() => {
    console.log('Text-to-Speech Reader extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "speak") {
        // Stop any current speech
        chrome.tts.stop();
        
        // Configure speech options
        const options = {
            onEvent: function(event) {
                if (event.type === 'end' || event.type === 'error' || event.type === 'interrupted') {
                    chrome.tabs.sendMessage(sender.tab.id, { action: "speechEnded" });
                }
            }
        };

        // Add voice if specified
        if (request.voice) {
            options.voiceName = request.voice.voiceName;
            options.lang = request.voice.lang;
        }

        // Speak the text
        chrome.tts.speak(request.text, options);
        sendResponse({ status: "speaking" });
        return true;
    } else if (request.action === "stop") {
        chrome.tts.stop();
        sendResponse({ status: "stopped" });
        return true;
    }
});

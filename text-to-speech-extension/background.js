// Background service worker for extension-wide functionality
let activeConnections = new Map();
let currentVoiceState = null;

// Voice validation
function isValidVoice(voice) {
    return voice && voice.voiceName && voice.lang;
}

// Initialize voice state
async function initializeVoiceState() {
    try {
        const result = await new Promise((resolve) => {
            chrome.storage.sync.get(['selectedVoice'], (result) => {
                resolve(result);
            });
        });
        
        if (result.selectedVoice && isValidVoice(result.selectedVoice)) {
            currentVoiceState = result.selectedVoice;
        } else {
            // Get default voice
            chrome.tts.getVoices((voices) => {
                if (voices && voices.length > 0) {
                    // Prefer English voices
                    const englishVoice = voices.find(v => v.lang && v.lang.startsWith('en') && !v.remote);
                    currentVoiceState = englishVoice || voices[0];
                }
            });
        }
    } catch (error) {
        console.error('Failed to initialize voice state:', error);
    }
}

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Text-to-Speech Reader extension installed');
    initializeVoiceState();
});

// Handle port connections
chrome.runtime.onConnect.addListener((port) => {
    console.log('Port connected:', port.name);
    
    // Store connection
    activeConnections.set(port.name, port);
    
    port.onMessage.addListener((msg) => {
        if (msg.action === 'getVoiceState') {
            port.postMessage({ 
                action: 'voiceStateUpdate', 
                voice: currentVoiceState 
            });
        }
    });
    
    port.onDisconnect.addListener(() => {
        console.log('Port disconnected:', port.name);
        activeConnections.delete(port.name);
        
        if (chrome.runtime.lastError) {
            console.warn('Port error:', chrome.runtime.lastError);
        }
    });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle ping messages for connection checking
    if (request.action === 'ping') {
        sendResponse({ status: 'connected' });
        return true;
    }
    
    // Handle voice selection
    if (request.action === 'voiceSelected' && request.voice) {
        if (isValidVoice(request.voice)) {
            currentVoiceState = request.voice;
            // Notify all active connections
            activeConnections.forEach(port => {
                try {
                    port.postMessage({ 
                        action: 'voiceStateUpdate', 
                        voice: currentVoiceState 
                    });
                } catch (error) {
                    console.warn('Failed to notify port:', port.name, error);
                }
            });
        }
        sendResponse({ status: 'voice updated' });
        return true;
    }
    
    // Handle speech requests
    if (request.action === "speak") {
        // Stop any current speech
        chrome.tts.stop();
        
        // Configure speech options
        const options = {
            onEvent: function(event) {
                if (event.type === 'end' || event.type === 'error' || event.type === 'interrupted') {
                    try {
                        chrome.tabs.sendMessage(sender.tab.id, { 
                            action: "speechEnded",
                            error: event.type === 'error' ? event.errorMessage : null
                        });
                    } catch (error) {
                        console.warn('Failed to send speech end event:', error);
                    }
                }
            }
        };

        // Add voice if specified, fallback to current state
        if (request.voice && isValidVoice(request.voice)) {
            options.voiceName = request.voice.voiceName;
            options.lang = request.voice.lang;
        } else if (currentVoiceState) {
            options.voiceName = currentVoiceState.voiceName;
            options.lang = currentVoiceState.lang;
        }

        // Speak the text
        try {
            chrome.tts.speak(request.text, options);
            sendResponse({ status: "speaking" });
        } catch (error) {
            console.error('Speech error:', error);
            sendResponse({ status: "error", message: error.message });
        }
        return true;
    }
    
    // Handle stop requests
    if (request.action === "stop") {
        chrome.tts.stop();
        sendResponse({ status: "stopped" });
        return true;
    }
});

// Handle extension suspension
chrome.runtime.onSuspend.addListener(() => {
    // Clean up
    chrome.tts.stop();
    activeConnections.clear();
});

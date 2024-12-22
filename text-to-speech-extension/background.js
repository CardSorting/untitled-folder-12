// Background service worker for extension-wide functionality
const voiceCache = {
    currentVoice: null,
    availableVoices: [],
    connections: new Map(),
    initialized: false,
    pendingOperations: new Map(),
    operationTimeout: 10000, // 10 seconds timeout for operations
    lastUpdate: null
};

// Voice state lifecycle management
class VoiceStateManager {
    constructor() {
        this.stateQueue = [];
        this.isProcessing = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async queueStateUpdate(operation) {
        return new Promise((resolve, reject) => {
            const operationId = Date.now().toString();
            
            // Add to pending operations
            voiceCache.pendingOperations.set(operationId, {
                resolve,
                reject,
                timestamp: Date.now(),
                operation
            });

            // Add to queue
            this.stateQueue.push(operationId);
            
            // Start processing if not already running
            if (!this.isProcessing) {
                this.processQueue();
            }

            // Set timeout for operation
            setTimeout(() => {
                if (voiceCache.pendingOperations.has(operationId)) {
                    const operation = voiceCache.pendingOperations.get(operationId);
                    voiceCache.pendingOperations.delete(operationId);
                    operation.reject(new Error('Operation timed out'));
                }
            }, voiceCache.operationTimeout);
        });
    }

    async processQueue() {
        if (this.isProcessing || this.stateQueue.length === 0) return;

        this.isProcessing = true;
        
        while (this.stateQueue.length > 0) {
            const operationId = this.stateQueue[0];
            const operation = voiceCache.pendingOperations.get(operationId);
            
            if (!operation) {
                this.stateQueue.shift();
                continue;
            }

            try {
                const result = await this.executeOperation(operation.operation);
                operation.resolve(result);
            } catch (error) {
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    console.warn(`Retrying operation (${this.retryCount}/${this.maxRetries}):`, error);
                    continue;
                }
                operation.reject(error);
            }

            voiceCache.pendingOperations.delete(operationId);
            this.stateQueue.shift();
            this.retryCount = 0;
        }

        this.isProcessing = false;
    }

    async executeOperation(operation) {
        switch (operation.type) {
            case 'updateVoice':
                return this.updateVoiceState(operation.voice);
            case 'initializeVoices':
                return this.initializeVoiceState();
            default:
                throw new Error(`Unknown operation type: ${operation.type}`);
        }
    }

    async updateVoiceState(voice) {
        if (!isValidVoice(voice)) {
            throw new Error('Invalid voice data');
        }

        // Verify voice is available
        if (!voiceCache.availableVoices.some(v => v.voiceName === voice.voiceName)) {
            throw new Error('Selected voice not available');
        }

        // Update cache
        voiceCache.currentVoice = voice;
        voiceCache.lastUpdate = Date.now();

        // Save to storage
        await new Promise((resolve, reject) => {
            chrome.storage.sync.set({ 
                selectedVoice: voice,
                lastUpdate: voiceCache.lastUpdate
            }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });

        // Broadcast update
        broadcastVoiceUpdate();
        return true;
    }

    async initializeVoiceState() {
        if (voiceCache.initialized) return true;

        // Load saved state
        const state = await new Promise((resolve) => {
            chrome.storage.sync.get(['selectedVoice', 'lastUpdate'], (result) => {
                resolve(result);
            });
        });

        // Get available voices
        const voices = await new Promise((resolve) => {
            chrome.tts.getVoices((voices) => {
                resolve(voices || []);
            });
        });
        
        voiceCache.availableVoices = voices;

        // Set current voice
        if (state.selectedVoice && isValidVoice(state.selectedVoice) && 
            voices.some(v => v.voiceName === state.selectedVoice.voiceName)) {
            voiceCache.currentVoice = state.selectedVoice;
            voiceCache.lastUpdate = state.lastUpdate || Date.now();
        } else {
            // Set default voice (prefer English)
            const defaultVoice = voices.find(v => v.lang && v.lang.startsWith('en') && !v.remote) || voices[0];
            if (defaultVoice) {
                voiceCache.currentVoice = {
                    voiceName: defaultVoice.voiceName || defaultVoice.name,
                    lang: defaultVoice.lang,
                    remote: defaultVoice.remote
                };
                voiceCache.lastUpdate = Date.now();
            }
        }

        voiceCache.initialized = true;
        broadcastVoiceUpdate();
        return true;
    }
}

const voiceStateManager = new VoiceStateManager();

// Voice validation
function isValidVoice(voice) {
    return voice && voice.voiceName && voice.lang;
}

// Broadcast voice update to all connections
function broadcastVoiceUpdate() {
    const message = { 
        action: 'voiceStateUpdate', 
        voice: voiceCache.currentVoice,
        timestamp: voiceCache.lastUpdate
    };

    // Notify all ports
    voiceCache.connections.forEach(port => {
        try {
            port.postMessage(message);
        } catch (error) {
            console.warn('Failed to notify port:', error);
        }
    });
}

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Text-to-Speech Reader extension installed');
    voiceStateManager.queueStateUpdate({ type: 'initializeVoices' });
});

// Handle port connections
chrome.runtime.onConnect.addListener((port) => {
    console.log('Port connected:', port.name);
    
    // Store connection
    voiceCache.connections.set(port.name, port);
    
    // Send current voice state
    if (voiceCache.currentVoice) {
        port.postMessage({ 
            action: 'voiceStateUpdate', 
            voice: voiceCache.currentVoice,
            timestamp: voiceCache.lastUpdate
        });
    }
    
    port.onMessage.addListener((msg) => {
        if (msg.action === 'getVoiceState') {
            port.postMessage({ 
                action: 'voiceStateUpdate', 
                voice: voiceCache.currentVoice,
                timestamp: voiceCache.lastUpdate
            });
        }
    });
    
    port.onDisconnect.addListener(() => {
        console.log('Port disconnected:', port.name);
        voiceCache.connections.delete(port.name);
    });
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle ping messages
    if (request.action === 'ping') {
        sendResponse({ 
            status: 'connected',
            timestamp: Date.now()
        });
        return true;
    }
    
    // Handle voice selection
    if (request.action === 'voiceSelected' && request.voice) {
        voiceStateManager.queueStateUpdate({
            type: 'updateVoice',
            voice: request.voice
        }).then(success => {
            sendResponse({ 
                status: success ? 'updated' : 'failed',
                timestamp: voiceCache.lastUpdate
            });
        }).catch(error => {
            sendResponse({ 
                status: 'failed',
                error: error.message
            });
        });
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
                            error: event.type === 'error' ? event.errorMessage : null,
                            timestamp: Date.now()
                        });
                    } catch (error) {
                        console.warn('Failed to send speech end event:', error);
                    }
                }
            }
        };

        // Use specified voice or fall back to cached voice
        const voice = request.voice || voiceCache.currentVoice;
        if (voice) {
            options.voiceName = voice.voiceName;
            options.lang = voice.lang;
        }

        // Speak the text
        try {
            chrome.tts.speak(request.text, options);
            sendResponse({ 
                status: "speaking",
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Speech error:', error);
            sendResponse({ 
                status: "error", 
                message: error.message,
                timestamp: Date.now()
            });
        }
        return true;
    }
    
    // Handle stop requests
    if (request.action === "stop") {
        chrome.tts.stop();
        sendResponse({ 
            status: "stopped",
            timestamp: Date.now()
        });
        return true;
    }
});

// Handle extension suspension
chrome.runtime.onSuspend.addListener(() => {
    chrome.tts.stop();
    voiceCache.connections.clear();
});

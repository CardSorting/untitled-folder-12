// State management with persistence
const state = {
    port: null,
    selectedVoice: null,
    hoveredElement: null,
    hoveredContent: null,
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 3,
    reconnectTimeout: null,
    lastUpdateTimestamp: null,
    availableVoices: [],
    voiceList: null,
    errorDiv: null,
    voiceSelectionVisible: false,
    pendingOperations: new Map()
};

// Try to load persisted voice selection
try {
    const savedVoice = localStorage.getItem('selectedVoice');
    if (savedVoice) {
        state.selectedVoice = JSON.parse(savedVoice);
    }
} catch (error) {
    console.warn('Failed to load persisted voice:', error);
}

// Initialize voice selection UI with toggle
function initializeVoiceUI() {
    // Create voice selection container
    const container = document.createElement('div');
    container.id = 'tts-voice-selection';
    container.style.cssText = `
        position: absolute;
        top: -420px;
        right: 0;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        padding: 20px;
        z-index: 10000;
        display: none;
        width: 320px;
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid rgba(0,0,0,0.1);
    `;

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        font-size: 24px;
        color: #666;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    `;
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = '#f0f0f0';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'none';
    });
    closeButton.addEventListener('click', toggleVoiceSelection);
    container.appendChild(closeButton);

    // Add error display
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        color: red;
        margin-bottom: 8px;
        display: none;
    `;
    container.appendChild(errorDiv);
    state.errorDiv = errorDiv;

    // Add title
    const title = document.createElement('div');
    title.textContent = 'Voice Selection';
    title.style.cssText = `
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #eee;
    `;
    container.appendChild(title);

    // Add voice list
    const voiceList = document.createElement('div');
    voiceList.style.cssText = `
        max-height: 300px;
        overflow-y: auto;
        padding-right: 8px;
    `;
    container.appendChild(voiceList);
    state.voiceList = voiceList;

    return container;
}

// Voice selection functions
async function loadVoices() {
    try {
        const voices = await new Promise((resolve) => {
            chrome.tts.getVoices((voices) => {
                if (!voices || voices.length === 0) {
                    resolve([]);
                    return;
                }
                resolve(voices);
            });
        });
        
        state.availableVoices = voices;
        displayVoices(voices);
    } catch (error) {
        console.error('Failed to load voices:', error);
        showError('Failed to load voices');
    }
}

function showError(message) {
    if (state.errorDiv) {
        state.errorDiv.textContent = message;
        state.errorDiv.style.display = 'block';
    }
}

function hideError() {
    if (state.errorDiv) {
        state.errorDiv.style.display = 'none';
    }
}

function displayVoices(voices) {
    if (!state.voiceList) return;
    
    state.voiceList.innerHTML = '';
    const voicesByLang = groupVoicesByLanguage(voices);
    
    Object.entries(voicesByLang).forEach(([langCode, group]) => {
        const langSection = document.createElement('div');
        langSection.className = 'voice-section';
        
        const header = document.createElement('div');
        header.textContent = `${group.name} (${group.voices.length})`;
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '8px';
        
        langSection.appendChild(header);
        
        group.voices
            .sort((a, b) => (a.voiceName || a.name).localeCompare(b.voiceName || b.name))
            .forEach(voice => {
                const voiceItem = createVoiceElement(voice);
                langSection.appendChild(voiceItem);
            });
        
        state.voiceList.appendChild(langSection);
    });
}

function createVoiceElement(voice) {
    const div = document.createElement('div');
    div.style.cssText = `
        padding: 12px;
        margin: 8px 0;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: ${state.selectedVoice && 
            (voice.voiceName === state.selectedVoice.voiceName || 
             voice.name === state.selectedVoice.voiceName) ? 
            'rgba(0, 122, 255, 0.1)' : '#f5f5f5'};
        transition: all 0.2s;
    `;

    div.addEventListener('mouseenter', () => {
        div.style.background = state.selectedVoice && 
            (voice.voiceName === state.selectedVoice.voiceName || 
             voice.name === state.selectedVoice.voiceName) ? 
            'rgba(0, 122, 255, 0.2)' : '#eee';
    });

    div.addEventListener('mouseleave', () => {
        div.style.background = state.selectedVoice && 
            (voice.voiceName === state.selectedVoice.voiceName || 
             voice.name === state.selectedVoice.voiceName) ? 
            'rgba(0, 122, 255, 0.1)' : '#f5f5f5';
    });
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = voice.voiceName || voice.name;
    
    const buttonContainer = document.createElement('div');
    
    const selectButton = document.createElement('button');
    selectButton.textContent = state.selectedVoice && 
        (voice.voiceName === state.selectedVoice.voiceName || 
         voice.name === state.selectedVoice.voiceName) ? 'Selected' : 'Select';
    selectButton.style.cssText = `
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        background: ${state.selectedVoice && 
            (voice.voiceName === state.selectedVoice.voiceName || 
             voice.name === state.selectedVoice.voiceName) ? 
            '#007AFF' : '#fff'};
        color: ${state.selectedVoice && 
            (voice.voiceName === state.selectedVoice.voiceName || 
             voice.name === state.selectedVoice.voiceName) ? 
            '#fff' : '#007AFF'};
        cursor: pointer;
        margin-right: 8px;
        font-weight: 500;
        transition: all 0.2s;
    `;
    selectButton.onclick = () => selectVoice(voice);
    
    const testButton = document.createElement('button');
    testButton.textContent = 'Test';
    testButton.style.cssText = `
        padding: 6px 12px;
        border: 1px solid #007AFF;
        border-radius: 4px;
        background: transparent;
        color: #007AFF;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    `;

    testButton.addEventListener('mouseenter', () => {
        testButton.style.background = 'rgba(0, 122, 255, 0.1)';
    });

    testButton.addEventListener('mouseleave', () => {
        testButton.style.background = 'transparent';
    });
    testButton.onclick = () => testVoice(voice);
    
    buttonContainer.appendChild(selectButton);
    buttonContainer.appendChild(testButton);
    
    div.appendChild(nameSpan);
    div.appendChild(buttonContainer);
    
    return div;
}

function groupVoicesByLanguage(voices) {
    const groups = {};
    voices.forEach(voice => {
        const lang = voice.lang || 'Unknown';
        if (!groups[lang]) {
            groups[lang] = {
                name: getLanguageName(lang),
                voices: []
            };
        }
        groups[lang].voices.push(voice);
    });
    
    return Object.fromEntries(
        Object.entries(groups).sort((a, b) => a[1].name.localeCompare(b[1].name))
    );
}

function getLanguageName(langCode) {
    try {
        return new Intl.DisplayNames(['en'], { type: 'language' }).of(langCode);
    } catch (e) {
        return langCode;
    }
}

function toggleVoiceSelection() {
    const container = document.getElementById('tts-voice-selection');
    if (!container) return;

    state.voiceSelectionVisible = !state.voiceSelectionVisible;
    
    if (state.voiceSelectionVisible) {
        // Show with animation
        container.style.display = 'block';
        container.style.opacity = '0';
        container.style.transform = 'translateY(20px)';
        setTimeout(() => {
            container.style.transition = 'all 0.3s ease-out';
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 0);
    } else {
        // Hide with animation
        container.style.transition = 'all 0.3s ease-in';
        container.style.opacity = '0';
        container.style.transform = 'translateY(20px)';
        setTimeout(() => {
            container.style.display = 'none';
        }, 300);
    }
}

async function selectVoice(voice) {
    try {
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: "voiceSelected",
                voice: {
                    voiceName: voice.voiceName || voice.name,
                    lang: voice.lang,
                    remote: voice.remote
                }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });

        if (response && response.status === 'updated') {
            state.selectedVoice = voice;
            // Persist voice selection
            try {
                localStorage.setItem('selectedVoice', JSON.stringify(voice));
            } catch (error) {
                console.warn('Failed to persist voice selection:', error);
            }
            displayVoices(state.availableVoices);
        }
    } catch (error) {
        console.error('Error selecting voice:', error);
        showError('Failed to select voice');
    }
}

async function testVoice(voice) {
    const testText = "This is a test of the text-to-speech voice.";
    
    try {
        await new Promise((resolve, reject) => {
            chrome.tts.stop();
            chrome.tts.speak(testText, {
                voiceName: voice.voiceName || voice.name,
                lang: voice.lang,
                onEvent: function(event) {
                    if (event.type === 'error') {
                        reject(new Error(event.errorMessage));
                    } else if (event.type === 'end') {
                        resolve();
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error testing voice:', error);
        showError('Failed to test voice');
    }
}

// Create overlay container for the speaker icon and settings
const overlay = document.createElement('div');
overlay.style.cssText = `
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    display: none;
    display: flex;
    align-items: center;
    gap: 8px;
`;

// Create speaker icon
const speakerIcon = document.createElement('div');
speakerIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 6L8 10H4V14H8L12 18V6Z"/>
        <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 12C17.0039 13.3308 16.4774 14.6024 15.54 15.54"/>
        <path d="M18.54 5.46C20.4892 7.40919 21.5751 10.1478 21.5751 13C21.5751 15.8522 20.4892 18.5908 18.54 20.54"/>
    </svg>
`;
speakerIcon.className = 'speech-icon';
speakerIcon.style.cssText = `
    background: #007AFF;
    border-radius: 50%;
    padding: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    cursor: pointer;
    pointer-events: auto;
    color: white;
    transition: all 0.2s;
    position: relative;
`;

// Create settings button
const settingsButton = document.createElement('div');
settingsButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
`;
settingsButton.style.cssText = `
    background: #007AFF;
    border-radius: 50%;
    padding: 6px;
    cursor: pointer;
    pointer-events: auto;
    color: white;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
`;

settingsButton.addEventListener('mouseenter', () => {
    settingsButton.style.transform = 'scale(1.1)';
    settingsButton.style.background = '#0051FF';
});

settingsButton.addEventListener('mouseleave', () => {
    settingsButton.style.transform = 'scale(1)';
    settingsButton.style.background = '#007AFF';
});

settingsButton.addEventListener('click', () => {
    toggleVoiceSelection();
    // Load voices immediately when opening
    if (!state.voiceSelectionVisible && state.availableVoices.length === 0) {
        loadVoices();
    }
});

// Add tooltip styles
const style = document.createElement('style');
style.textContent = `
    .speech-icon .tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        left: 50%;
        transform: translateX(-50%);
        bottom: -30px;
        opacity: 0;
        transition: opacity 0.2s;
    }
    
    .speech-icon:hover .tooltip {
        opacity: 1;
    }
    
    .highlight-message {
        background-color: rgba(0, 122, 255, 0.1) !important;
        border: 2px solid rgba(0, 122, 255, 0.3) !important;
        border-radius: 8px;
        position: relative;
    }
`;
document.head.appendChild(style);

// Connection management
async function connectToBackground() {
    if (state.reconnectAttempts >= state.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        return false;
    }

    try {
        // Check connection first
        const response = await checkConnection();
        if (!response.connected) {
            throw new Error('Connection check failed');
        }

        // Create port connection
        state.port = chrome.runtime.connect({ name: 'content-script-' + Date.now() });
        
        state.port.onMessage.addListener((msg) => {
            if (msg.action === 'voiceStateUpdate' && msg.voice) {
                // Only update if the message is newer than our last update
                if (!state.lastUpdateTimestamp || msg.timestamp > state.lastUpdateTimestamp) {
                    state.selectedVoice = msg.voice;
                    state.lastUpdateTimestamp = msg.timestamp;
                }
            }
        });
        
        state.port.onDisconnect.addListener(() => {
            state.isConnected = false;
            state.port = null;
            
            if (chrome.runtime.lastError) {
                console.warn('Port disconnected:', chrome.runtime.lastError);
                scheduleReconnect();
            }
        });

        // Get initial voice state
        state.port.postMessage({ action: 'getVoiceState' });
        
        state.isConnected = true;
        state.reconnectAttempts = 0;
        return true;
    } catch (error) {
        console.warn('Connection attempt failed:', error);
        scheduleReconnect();
        return false;
    }
}

function scheduleReconnect() {
    if (state.reconnectTimeout) {
        clearTimeout(state.reconnectTimeout);
    }
    
    state.reconnectAttempts++;
    if (state.reconnectAttempts < state.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts - 1), 5000);
        state.reconnectTimeout = setTimeout(() => connectToBackground(), delay);
    }
}

async function checkConnection() {
    try {
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
                if (chrome.runtime.lastError) {
                    resolve({ connected: false });
                } else {
                    resolve({ 
                        connected: response && response.status === 'connected',
                        timestamp: response?.timestamp
                    });
                }
            });
        });
        return response;
    } catch {
        return { connected: false };
    }
}

// Speech handling
async function speakWithRetry(text, voice, retryCount = 0) {
    const maxRetries = 3;
    
    try {
        const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: "speak",
                text: text,
                voice: voice
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });

        if (response.status === "speaking") {
            return true;
        } else {
            throw new Error(response.message || 'Speech failed');
        }
    } catch (error) {
        if (retryCount < maxRetries) {
            console.warn(`Speech attempt ${retryCount + 1} failed:`, error);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return speakWithRetry(text, voice, retryCount + 1);
        }
        throw error;
    }
}

// Message handling
function findMessageContainer(element) {
    const messageContainer = element.closest('.font-claude-message');
    if (!messageContainer) return null;

    const content = messageContainer.textContent.trim();
    return { container: messageContainer, content };
}

async function speakMessage() {
    if (!state.hoveredContent) return;

    try {
        if (!state.isConnected) {
            const connected = await connectToBackground();
            if (!connected) {
                console.error('Failed to establish connection');
                return;
            }
        }

        await operationQueue.add({
            type: 'speak',
            text: state.hoveredContent,
            voice: state.selectedVoice
        });

        // Visual feedback
        if (state.hoveredElement) {
            state.hoveredElement.style.transition = 'background-color 0.3s';
            state.hoveredElement.style.backgroundColor = 'rgba(0, 122, 255, 0.2)';
            setTimeout(() => {
                if (state.hoveredElement) {
                    state.hoveredElement.style.backgroundColor = 'rgba(0, 122, 255, 0.1)';
                }
            }, 200);
        }
    } catch (error) {
        console.error('Failed to speak message:', error);
        scheduleReconnect();
    }
}

// Event handlers
function addHoverEffect() {
    document.addEventListener('mouseover', (e) => {
        const result = findMessageContainer(e.target);
        if (result && result.container !== state.hoveredElement) {
            document.querySelectorAll('.highlight-message').forEach(el => {
                el.classList.remove('highlight-message');
            });
            
            result.container.classList.add('highlight-message');
            state.hoveredElement = result.container;
            state.hoveredContent = result.content;
            
            const rect = result.container.getBoundingClientRect();
            overlay.style.display = 'flex';
            overlay.style.top = `${rect.top + 20}px`;
            overlay.style.left = `${rect.right - 100}px`;
        }
    });

    document.addEventListener('mouseout', (e) => {
        const result = findMessageContainer(e.target);
        if (result && !e.relatedTarget?.closest('.speech-icon') && !e.relatedTarget?.closest('#tts-voice-selection')) {
            result.container.classList.remove('highlight-message');
            if (state.hoveredElement === result.container) {
                state.hoveredElement = null;
                state.hoveredContent = null;
                overlay.style.display = 'none';
            }
        }
    });
}

// Icon event listeners
speakerIcon.addEventListener('mouseenter', () => {
    speakerIcon.style.transform = 'scale(1.1)';
    speakerIcon.style.background = '#0051FF';
});

speakerIcon.addEventListener('mouseleave', () => {
    speakerIcon.style.transform = 'scale(1)';
    speakerIcon.style.background = '#007AFF';
});

speakerIcon.addEventListener('click', speakMessage);

// Message listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "voiceSelected") {
        if (!state.lastUpdateTimestamp || request.timestamp > state.lastUpdateTimestamp) {
            state.selectedVoice = request.voice;
            state.lastUpdateTimestamp = request.timestamp;
        }
        sendResponse({ status: "voice updated" });
    } else if (request.action === "speechEnded") {
        if (request.error) {
            console.error('Speech error:', request.error);
            scheduleReconnect();
        }
    }
});

// Initialize
(async function initialize() {
    try {
        // Initialize UI
        overlay.appendChild(speakerIcon);
        overlay.appendChild(settingsButton);
        document.body.appendChild(overlay);
        
        // Create and add voice selection panel
        const voicePanel = initializeVoiceUI();
        overlay.appendChild(voicePanel);
        
        // Add hover effect
        addHoverEffect();

        // Connect and load voices
        await connectToBackground();
        const voices = await loadVoices();

        // Show voice selection automatically if no voice is selected
        if (!state.selectedVoice) {
            // Create notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 80px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10002;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease-out;
            `;
            notification.textContent = 'Please select a voice for text-to-speech';
            document.body.appendChild(notification);

            // Show notification with animation
            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateY(0)';
            }, 100);

            // Show voice selection panel
            setTimeout(() => {
                toggleVoiceSelection();
                // Remove notification with animation
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(20px)';
                setTimeout(() => notification.remove(), 300);
            }, 1500);
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
})();

// Cleanup
window.addEventListener('unload', () => {
    if (state.reconnectTimeout) {
        clearTimeout(state.reconnectTimeout);
    }
    if (state.port) {
        state.port.disconnect();
    }
});

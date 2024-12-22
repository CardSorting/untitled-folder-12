// State management
const state = {
    port: null,
    selectedVoice: null,
    hoveredElement: null,
    hoveredContent: null,
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 3,
    reconnectTimeout: null
};

// Create overlay container for the speaker icon
const overlay = document.createElement('div');
overlay.style.cssText = `
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  display: none;
`;

const speakerIcon = document.createElement('div');
speakerIcon.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M12 6L8 10H4V14H8L12 18V6Z"/>
    <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 12C17.0039 13.3308 16.4774 14.6024 15.54 15.54"/>
    <path d="M18.54 5.46C20.4892 7.40919 21.5751 10.1478 21.5751 13C21.5751 15.8522 20.4892 18.5908 18.54 20.54"/>
  </svg>
  <span class="tooltip">Click to speak</span>
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
        const isConnected = await checkConnection();
        if (!isConnected) {
            throw new Error('Connection check failed');
        }

        // Create port connection
        state.port = chrome.runtime.connect({ name: 'content-script-' + Date.now() });
        
        state.port.onMessage.addListener((msg) => {
            if (msg.action === 'voiceStateUpdate' && msg.voice) {
                state.selectedVoice = msg.voice;
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
                    resolve(false);
                } else {
                    resolve(response && response.status === 'connected');
                }
            });
        });
        return response;
    } catch {
        return false;
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

        chrome.runtime.sendMessage({
            action: "speak",
            text: state.hoveredContent,
            voice: state.selectedVoice
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('Speech error:', chrome.runtime.lastError);
                if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
                    window.location.reload();
                }
                return;
            }
            
            if (response && response.status === "speaking" && state.hoveredElement) {
                state.hoveredElement.style.transition = 'background-color 0.3s';
                state.hoveredElement.style.backgroundColor = 'rgba(0, 122, 255, 0.2)';
                setTimeout(() => {
                    if (state.hoveredElement) {
                        state.hoveredElement.style.backgroundColor = 'rgba(0, 122, 255, 0.1)';
                    }
                }, 200);
            }
        });
    } catch (error) {
        console.error('Failed to speak message:', error);
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
            overlay.style.display = 'block';
            overlay.style.top = `${rect.top + 20}px`;
            overlay.style.left = `${rect.right - 60}px`;
        }
    });

    document.addEventListener('mouseout', (e) => {
        const result = findMessageContainer(e.target);
        if (result && !e.relatedTarget?.closest('.speech-icon')) {
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
        state.selectedVoice = request.voice;
        sendResponse({ status: "voice updated" });
    } else if (request.action === "speechEnded") {
        if (request.error) {
            console.error('Speech error:', request.error);
        }
    }
});

// Initialize
overlay.appendChild(speakerIcon);
document.body.appendChild(overlay);
addHoverEffect();
connectToBackground();

// Cleanup
window.addEventListener('unload', () => {
    if (state.reconnectTimeout) {
        clearTimeout(state.reconnectTimeout);
    }
    if (state.port) {
        state.port.disconnect();
    }
});

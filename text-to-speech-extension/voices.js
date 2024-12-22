const errorDiv = document.getElementById('error');
const voiceList = document.getElementById('voiceList');

// State management with validation and defaults
const state = {
    selectedVoice: null,
    availableVoices: [],
    retryTimeout: null,
    defaultVoice: null,
    isInitialized: false
};

// Voice validation schema
const voiceSchema = {
    required: ['voiceName', 'lang'],
    validate: (voice) => {
        if (!voice) return false;
        return voiceSchema.required.every(prop => voice[prop] !== undefined);
    }
};

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    errorDiv.style.display = 'none';
}

// Initialize state with default voice
async function initializeState() {
    if (state.isInitialized) return;

    try {
        // Load saved voice
        const savedVoice = await getSavedVoice();
        
        // Get available voices
        const voices = await getVoices();
        state.availableVoices = voices;

        // Set default voice (prefer English voices if available)
        state.defaultVoice = findDefaultVoice(voices);

        // Validate and set selected voice
        if (savedVoice && isVoiceAvailable(savedVoice, voices)) {
            state.selectedVoice = savedVoice;
        } else {
            state.selectedVoice = state.defaultVoice;
            if (state.selectedVoice) {
                await saveVoicePreference(state.selectedVoice);
            }
        }

        state.isInitialized = true;
    } catch (error) {
        console.error('Failed to initialize state:', error);
        showError('Failed to initialize voice settings');
    }
}

// Get voices with retry mechanism
async function getVoices() {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            const voices = await new Promise((resolve, reject) => {
                chrome.tts.getVoices((voices) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    if (!voices || voices.length === 0) {
                        reject(new Error('No voices available'));
                        return;
                    }
                    resolve(voices);
                });
            });
            return voices;
        } catch (error) {
            console.warn(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            if (retryCount === maxRetries) {
                throw new Error('Failed to load voices after multiple attempts');
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Find best default voice
function findDefaultVoice(voices) {
    // Prefer English voices
    const englishVoices = voices.filter(v => v.lang && v.lang.startsWith('en'));
    
    if (englishVoices.length > 0) {
        // Prefer non-remote voices
        const localVoice = englishVoices.find(v => !v.remote);
        if (localVoice) return localVoice;
        return englishVoices[0];
    }
    
    // Fallback to first available voice
    return voices[0];
}

// Check if voice is available
function isVoiceAvailable(voice, availableVoices) {
    if (!voiceSchema.validate(voice)) return false;
    return availableVoices.some(v => 
        v.voiceName === voice.voiceName && 
        v.lang === voice.lang
    );
}

async function displayVoices(retryCount = 0) {
    hideError();
    voiceList.innerHTML = '<div class="loading">Loading voices...</div>';

    try {
        await initializeState();
        const voicesByLang = groupVoicesByLanguage(state.availableVoices);
        displayGroupedVoices(voicesByLang);
    } catch (error) {
        console.error('Error displaying voices:', error);
        if (retryCount < 3) {
            console.warn(`Failed to display voices, retrying (${retryCount + 1}/3)...`);
            state.retryTimeout = setTimeout(() => displayVoices(retryCount + 1), 1000);
            return;
        }
        showError('Failed to load voices: ' + error.message);
    }
}

async function getSavedVoice() {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            const result = await new Promise((resolve, reject) => {
                chrome.storage.sync.get(['selectedVoice'], (result) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    resolve(result);
                });
            });
            
            const voice = result.selectedVoice;
            if (!voice || !voiceSchema.validate(voice)) {
                return null;
            }
            return voice;
        } catch (error) {
            console.warn(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            if (retryCount === maxRetries) {
                console.error('Failed to load voice after retries');
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return null;
}

async function saveVoicePreference(voice) {
    if (!voiceSchema.validate(voice)) {
        console.error('Invalid voice data:', voice);
        return;
    }

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            await new Promise((resolve, reject) => {
                chrome.storage.sync.set({
                    selectedVoice: {
                        voiceName: voice.voiceName || voice.name,
                        lang: voice.lang,
                        remote: voice.remote
                    }
                }, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    resolve();
                });
            });
            return;
        } catch (error) {
            console.warn(`Save attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            if (retryCount === maxRetries) {
                console.error('Failed to save voice preference after retries');
                showError('Failed to save voice preference');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function notifyContentScripts(voice) {
    if (!voiceSchema.validate(voice)) {
        console.error('Invalid voice data for notification:', voice);
        return;
    }

    // Create a long-lived connection to the background script
    const port = chrome.runtime.connect({ name: 'voice-selection' });
    
    port.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
            console.warn('Port disconnected:', chrome.runtime.lastError);
            // Attempt to reload the popup
            window.location.reload();
        }
    });

    try {
        const tabs = await new Promise((resolve, reject) => {
            chrome.tabs.query({}, (tabs) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                resolve(tabs);
            });
        });

        const voiceData = {
            voiceName: voice.voiceName || voice.name,
            lang: voice.lang,
            remote: voice.remote
        };

        // Use Promise.allSettled to handle all tab notifications
        const notifications = tabs.map(tab => {
            return new Promise((resolve) => {
                try {
                    chrome.tabs.sendMessage(tab.id, {
                        action: "voiceSelected",
                        voice: voiceData
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            resolve({ status: 'rejected', tab: tab.id });
                        } else {
                            resolve({ status: 'fulfilled', tab: tab.id });
                        }
                    });
                } catch (error) {
                    resolve({ status: 'rejected', tab: tab.id, error });
                }
            });
        });

        const results = await Promise.allSettled(notifications);
        const failedTabs = results
            .filter(r => r.value.status === 'rejected')
            .map(r => r.value.tab);
        
        if (failedTabs.length > 0) {
            console.debug('Could not send to tabs:', failedTabs);
        }
    } catch (error) {
        console.error('Error notifying tabs:', error);
    }
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

function displayGroupedVoices(voicesByLang) {
    voiceList.innerHTML = '';

    Object.entries(voicesByLang).forEach(([langCode, group]) => {
        const langSection = document.createElement('div');
        langSection.className = 'language-section';
        
        const header = document.createElement('div');
        header.className = 'language-header';
        
        const langName = document.createElement('div');
        langName.className = 'language-name';
        langName.textContent = group.name;
        langName.setAttribute('data-count', `(${group.voices.length})`);
        
        const collapseButton = document.createElement('button');
        collapseButton.className = 'collapse-button';
        collapseButton.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 4L6 8L10 4" stroke="currentColor" fill="none" stroke-width="2"/>
            </svg>
        `;
        
        header.appendChild(langName);
        header.appendChild(collapseButton);
        
        const voicesContainer = document.createElement('div');
        voicesContainer.className = 'voices-container';
        
        group.voices
            .sort((a, b) => (a.voiceName || a.name).localeCompare(b.voiceName || b.name))
            .forEach(voice => {
                const voiceItem = createVoiceElement(voice);
                voicesContainer.appendChild(voiceItem);
            });
        
        header.onclick = () => {
            langSection.classList.toggle('collapsed');
            collapseButton.classList.toggle('collapsed');
        };
        
        langSection.appendChild(header);
        langSection.appendChild(voicesContainer);
        voiceList.appendChild(langSection);
    });
}

function createVoiceElement(voice) {
    const div = document.createElement('div');
    div.className = 'voice-item';
    if (state.selectedVoice && (voice.voiceName === state.selectedVoice.voiceName || voice.name === state.selectedVoice.voiceName)) {
        div.classList.add('selected');
    }
    
    const voiceInfo = document.createElement('div');
    voiceInfo.className = 'voice-info';
    
    const name = document.createElement('div');
    name.className = 'voice-name';
    name.textContent = voice.voiceName || voice.name;
    
    const details = document.createElement('div');
    details.className = `voice-details${voice.remote ? ' remote' : ''}`;
    details.textContent = voice.remote ? 'Remote' : 'Local';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const selectButton = document.createElement('button');
    selectButton.className = 'select-button';
    selectButton.textContent = state.selectedVoice && 
        (voice.voiceName === state.selectedVoice.voiceName || voice.name === state.selectedVoice.voiceName) 
        ? 'Selected' : 'Select';
    selectButton.onclick = (e) => {
        e.stopPropagation();
        selectVoice(voice, selectButton, div);
    };
    
    const testButton = document.createElement('button');
    testButton.className = 'test-button';
    testButton.textContent = 'Test';
    testButton.onclick = (e) => {
        e.stopPropagation();
        testVoice(voice);
    };
    
    voiceInfo.appendChild(name);
    voiceInfo.appendChild(details);
    buttonContainer.appendChild(selectButton);
    buttonContainer.appendChild(testButton);
    div.appendChild(voiceInfo);
    div.appendChild(buttonContainer);
    
    return div;
}

async function selectVoice(voice, button, item) {
    if (!voiceSchema.validate(voice)) {
        console.error('Invalid voice selected:', voice);
        showError('Invalid voice selection');
        return;
    }

    try {
        // Update UI
        document.querySelectorAll('.voice-item').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.select-button').forEach(btn => btn.textContent = 'Select');
        item.classList.add('selected');
        button.textContent = 'Selected';

        // Update state
        state.selectedVoice = voice;

        // Save preference
        await saveVoicePreference(voice);

        // Notify content scripts
        await notifyContentScripts(voice);
    } catch (error) {
        console.error('Error selecting voice:', error);
        showError('Failed to select voice');
        
        // Revert UI on error
        item.classList.remove('selected');
        button.textContent = 'Select';
    }
}

function testVoice(voice) {
    if (!voiceSchema.validate(voice)) {
        console.error('Invalid voice for testing:', voice);
        showError('Invalid voice');
        return;
    }

    const testText = "This is a test of the text-to-speech voice.";
    
    try {
        chrome.tts.stop();
        chrome.tts.speak(testText, {
            voiceName: voice.voiceName || voice.name,
            lang: voice.lang,
            onEvent: function(event) {
                if (event.type === 'error') {
                    showError('Error testing voice: ' + event.errorMessage);
                }
            }
        });
    } catch (error) {
        showError('Failed to test voice: ' + error.message);
    }
}

// Initial load of voices
document.addEventListener('DOMContentLoaded', async () => {
    if (state.retryTimeout) {
        clearTimeout(state.retryTimeout);
    }
    await displayVoices();
});

// Handle extension context invalidation
chrome.runtime.onSuspend.addListener(() => {
    if (state.retryTimeout) {
        clearTimeout(state.retryTimeout);
    }
    chrome.tts.stop();
});

// Handle connection errors
window.addEventListener('unload', () => {
    if (state.retryTimeout) {
        clearTimeout(state.retryTimeout);
    }
});

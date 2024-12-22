const errorDiv = document.getElementById('error');
const voiceList = document.getElementById('voiceList');

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    errorDiv.style.display = 'none';
}

function displayVoices() {
    hideError();
    voiceList.innerHTML = '<div class="loading">Loading voices...</div>';

    try {
        // Get Chrome TTS voices
        chrome.tts.getVoices((voices) => {
            if (chrome.runtime.lastError) {
                showError('Error loading voices: ' + chrome.runtime.lastError.message);
                return;
            }

            if (!voices || voices.length === 0) {
                voiceList.innerHTML = '<div class="no-voices">No text-to-speech voices found</div>';
                return;
            }

            // Group voices by language
            const voicesByLang = groupVoicesByLanguage(voices);
            displayGroupedVoices(voicesByLang);
        });
    } catch (error) {
        showError('Failed to load voices: ' + error.message);
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
    
    // Sort languages alphabetically
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
    voiceList.innerHTML = ''; // Clear loading message

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
        
        // Sort voices by name within each language group
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
    
    const voiceInfo = document.createElement('div');
    voiceInfo.className = 'voice-info';
    
    const name = document.createElement('div');
    name.className = 'voice-name';
    name.textContent = voice.voiceName || voice.name;
    
    const details = document.createElement('div');
    details.className = `voice-details${voice.remote ? ' remote' : ''}`;
    details.textContent = voice.remote ? 'Remote' : 'Local';
    
    const testButton = document.createElement('button');
    testButton.className = 'test-button';
    testButton.textContent = 'Test Voice';
    testButton.onclick = (e) => {
        e.stopPropagation();
        testVoice(voice);
    };
    
    voiceInfo.appendChild(name);
    voiceInfo.appendChild(details);
    div.appendChild(voiceInfo);
    div.appendChild(testButton);
    
    return div;
}

function testVoice(voice) {
    const testText = "This is a test of the text-to-speech voice.";
    
    try {
        chrome.tts.stop(); // Stop any current speech
        chrome.tts.speak(testText, {
            voiceName: voice.voiceName || voice.name,
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
document.addEventListener('DOMContentLoaded', displayVoices);

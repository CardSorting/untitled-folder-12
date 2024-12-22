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
    voiceList.innerHTML = ''; // Clear loading message

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

            voices.forEach(voice => {
                const voiceItem = createVoiceElement(voice);
                voiceList.appendChild(voiceItem);
            });
        });
    } catch (error) {
        showError('Failed to load voices: ' + error.message);
    }
}

function createVoiceElement(voice) {
    const div = document.createElement('div');
    div.className = 'voice-item';
    
    const testButton = document.createElement('button');
    testButton.className = 'test-button';
    testButton.textContent = 'Test Voice';
    testButton.onclick = () => testVoice(voice);
    
    const name = document.createElement('div');
    name.className = 'voice-name';
    name.textContent = voice.voiceName || voice.name;
    
    const details = document.createElement('div');
    details.className = 'voice-details';
    const lang = voice.lang || 'N/A';
    const remote = voice.remote ? '(Remote)' : '(Local)';
    details.textContent = `Language: ${lang} ${remote}`;
    
    div.appendChild(testButton);
    div.appendChild(name);
    div.appendChild(details);
    
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

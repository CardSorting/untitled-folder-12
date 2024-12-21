// Content script for handling text-to-speech
class TextReader {
    constructor() {
        this.synth = window.speechSynthesis;
        this.currentUtterance = null;
        this.initializeListeners();
    }

    initializeListeners() {
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'readText') {
                this.readText(message.text);
            } else if (message.type === 'stopSpeech') {
                this.stopSpeech();
            }
        });

        // Add keyboard shortcut listener
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + Shift + S to start/stop speech
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
                event.preventDefault();
                if (this.currentUtterance) {
                    this.stopSpeech();
                } else {
                    const selectedText = window.getSelection().toString().trim();
                    if (selectedText) {
                        this.readText(selectedText);
                    }
                }
            }
        });
    }

    readText(text) {
        // Stop any current speech
        this.stopSpeech();

        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text);

        // Configure speech settings
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = document.documentElement.lang || 'en';

        // Handle speech end
        utterance.onend = () => {
            this.currentUtterance = null;
        };

        // Handle speech errors
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.currentUtterance = null;
        };

        // Start speaking
        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    }

    stopSpeech() {
        if (this.currentUtterance) {
            this.synth.cancel();
            this.currentUtterance = null;
        }
    }
}

// Initialize the text reader
const textReader = new TextReader();

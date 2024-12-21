// Content script for handling text selection and speech synthesis
import { createLogger, Logger } from './utils/logger';
import { celeryClient } from './utils/celeryClient';

interface ContentState {
    isProcessing: boolean;
    isPaused: boolean;
    selectedText: string;
    currentUtterance: SpeechSynthesisUtterance | null;
    preferredVoice: SpeechSynthesisVoice | null;
    settings: {
        rate: number;
        pitch: number;
        volume: number;
        autoResume: boolean;
        language: string;
    };
}

interface TTSSettings {
    ttsSettings?: {
        rate: number;
        pitch: number;
        volume: number;
        autoResume: boolean;
        language: string;
    };
}

class ContentController {
    private static instance: ContentController;
    private logger: Logger;
    private state: ContentState;
    private speechSynthesis: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[];

    private constructor() {
        this.logger = createLogger('Content');
        this.state = {
            isProcessing: false,
            isPaused: false,
            selectedText: '',
            currentUtterance: null,
            preferredVoice: null,
            settings: {
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                autoResume: true,
                language: document.documentElement.lang || 'en'
            }
        };

        // Initialize web speech synthesis
        this.speechSynthesis = window.speechSynthesis;
        this.voices = [];

        // Initialize listeners
        this.initializeListeners();
        
        // Signal that content script is ready
        chrome.runtime.sendMessage({ type: 'contentScriptReady' });
    }

    public static getInstance(): ContentController {
        if (!ContentController.instance) {
            ContentController.instance = new ContentController();
        }
        return ContentController.instance;
    }

    private async loadSettings(): Promise<void> {
        try {
            const settings = await chrome.storage.local.get('ttsSettings') as TTSSettings;
            if (settings.ttsSettings) {
                this.state.settings = { ...this.state.settings, ...settings.ttsSettings };
            }
        } catch (error) {
            this.logger.error('Error loading settings:', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }

    private async saveSettings(): Promise<void> {
        try {
            await chrome.storage.local.set({ ttsSettings: this.state.settings });
        } catch (error) {
            this.logger.error('Error saving settings:', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }

    private async initializeVoices(): Promise<void> {
        if ('onvoiceschanged' in this.speechSynthesis) {
            this.speechSynthesis.onvoiceschanged = () => {
                this.voices = this.speechSynthesis.getVoices();
                const preferredVoice = this.voices.find(voice => 
                    voice.lang.startsWith(this.state.settings.language)
                );
                if (preferredVoice) {
                    this.state.preferredVoice = preferredVoice;
                }
            };
        }
        this.voices = this.speechSynthesis.getVoices();
    }

    private initializeListeners(): void {
        // Listen for messages from the background script
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

        // Listen for text selection
        document.addEventListener('mouseup', this.handleTextSelection.bind(this));
        document.addEventListener('keyup', this.handleKeyboardShortcuts.bind(this));

        // Handle visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    private handleMessage(
        message: any,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void
    ): void {
        if (message.type === 'updateSettings') {
            this.updateSettings(message.settings);
            sendResponse({ success: true });
        }
    }

    private handleTextSelection(event: MouseEvent): void {
        const selection = window.getSelection();
        if (selection) {
            this.state.selectedText = selection.toString().trim();
        }
    }

    private handleKeyboardShortcuts(event: KeyboardEvent): void {
        // Add keyboard shortcut handling logic here
    }

    private handleVisibilityChange(): void {
        if (document.hidden && this.state.settings.autoResume) {
            this.pauseSpeech();
        } else {
            this.resumeSpeech();
        }
    }

    private handleBeforeUnload(): void {
        this.stopSpeech();
    }

    private updateSettings(newSettings: Partial<ContentState['settings']>): void {
        this.state.settings = { ...this.state.settings, ...newSettings };
        this.saveSettings();
    }

    private async speakText(text: string, options: Partial<ContentState['settings']> = {}): Promise<void> {
        if (this.state.isProcessing) {
            return;
        }

        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = options.rate || this.state.settings.rate;
            utterance.pitch = options.pitch || this.state.settings.pitch;
            utterance.volume = options.volume || this.state.settings.volume;
            utterance.voice = this.state.preferredVoice;

            // Handle speech events
            utterance.onstart = this.onstart.bind(this);
            utterance.onend = this.onend.bind(this);
            utterance.onerror = this.onerror.bind(this);
            utterance.onpause = this.onpause.bind(this);
            utterance.onresume = this.onresume.bind(this);
            utterance.onboundary = this.onboundary.bind(this);

            this.state.currentUtterance = utterance;
            this.state.isProcessing = true;
            this.speechSynthesis.speak(utterance);
        } catch (error) {
            this.handleError(error);
        }
    }

    private onstart(): void {
        this.logger.debug('Speech started');
    }

    private onend(): void {
        this.logger.debug('Speech ended');
        this.reset();
    }

    private onerror(event: SpeechSynthesisErrorEvent): void {
        this.logger.error('Speech error:', event);
        this.reset();
    }

    private onpause(): void {
        this.logger.debug('Speech paused');
    }

    private onresume(): void {
        this.logger.debug('Speech resumed');
    }

    private onboundary(event: SpeechSynthesisEvent): void {
        this.logger.debug('Speech boundary reached:', event);
    }

    private pauseSpeech(): void {
        if (this.speechSynthesis.speaking && !this.state.isPaused) {
            this.speechSynthesis.pause();
            this.state.isPaused = true;
        }
    }

    private resumeSpeech(): void {
        if (this.state.isPaused) {
            this.speechSynthesis.resume();
            this.state.isPaused = false;
        }
    }

    private stopSpeech(): void {
        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
        }
        this.reset();
    }

    private reset(): void {
        this.state.isProcessing = false;
        this.state.currentUtterance = null;
        this.state.isPaused = false;
    }

    private handleError(error: unknown): void {
        this.logger.error('Error:', { error: error instanceof Error ? error.message : 'Unknown error' });
        this.reset();
    }

    private async processSelectedText(): Promise<void> {
        if (this.state.isProcessing || !this.state.selectedText) {
            return;
        }

        try {
            await celeryClient.processText(this.state.selectedText, this.state.settings);
            // The background script will handle the result and call back with processResult
        } catch (error) {
            this.handleError(error);
        }
    }
}

// Export singleton instance
export const contentController = ContentController.getInstance();

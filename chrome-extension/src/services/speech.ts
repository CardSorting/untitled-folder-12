import { createLogger } from '../utils/logger';
import { TextProcessingSettings } from '../types/settings';

const logger = createLogger('Speech');

export class SpeechService {
    private static instance: SpeechService;
    private synthesis: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[];
    private currentUtterance: SpeechSynthesisUtterance | null;

    private constructor() {
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;
        this.initializeVoices();
    }

    public static getInstance(): SpeechService {
        if (!SpeechService.instance) {
            SpeechService.instance = new SpeechService();
        }
        return SpeechService.instance;
    }

    private initializeVoices(): void {
        if ('onvoiceschanged' in this.synthesis) {
            this.synthesis.onvoiceschanged = () => {
                this.voices = this.synthesis.getVoices();
                logger.debug('Voices loaded:', { count: this.voices.length });
            };
        }
        this.voices = this.synthesis.getVoices();
    }

    public getVoices(): SpeechSynthesisVoice[] {
        return this.voices;
    }

    public findVoice(language: string): SpeechSynthesisVoice | undefined {
        return this.voices.find(voice => voice.lang.startsWith(language));
    }

    public async speak(text: string, settings: TextProcessingSettings): Promise<void> {
        if (this.currentUtterance) {
            this.stop();
        }

        return new Promise((resolve, reject) => {
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = settings.rate;
                utterance.pitch = settings.pitch;
                utterance.volume = settings.volume;
                
                const voice = this.findVoice(settings.language);
                if (voice) {
                    utterance.voice = voice;
                }

                utterance.onend = () => {
                    this.currentUtterance = null;
                    resolve();
                };

                utterance.onerror = (event) => {
                    this.currentUtterance = null;
                    reject(new Error(event.error));
                };

                this.currentUtterance = utterance;
                this.synthesis.speak(utterance);
            } catch (error) {
                reject(error);
            }
        });
    }

    public pause(): void {
        if (this.synthesis.speaking) {
            this.synthesis.pause();
        }
    }

    public resume(): void {
        if (this.synthesis.paused) {
            this.synthesis.resume();
        }
    }

    public stop(): void {
        this.synthesis.cancel();
        this.currentUtterance = null;
    }

    public isSpeaking(): boolean {
        return this.synthesis.speaking;
    }

    public isPaused(): boolean {
        return this.synthesis.paused;
    }
}

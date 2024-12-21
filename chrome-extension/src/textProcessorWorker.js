// Text processor worker for handling speech synthesis
import { CeleryClient } from './utils/celeryClient';

class TextProcessorWorker {
    constructor() {
        this.celeryClient = new CeleryClient();
        this.currentOptions = {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            language: 'en'
        };
    }

    async processText(text, options = {}) {
        try {
            // Merge options with defaults
            const processOptions = {
                ...this.currentOptions,
                ...options,
                emotionalContext: this._analyzeEmotionalContext(text),
                textStructure: this._analyzeTextStructure(text)
            };

            // Process text through backend
            const { taskId } = await this.celeryClient.processText(text, processOptions);
            
            // Wait for processing to complete
            const processedText = await this.celeryClient.pollTaskStatus(taskId);
            
            // Return the processed text
            return this._processSSMLMarkers(processedText);
        } catch (error) {
            console.error('Error processing text:', error);
            throw error;
        }
    }

    _analyzeEmotionalContext(text) {
        // Simple emotion analysis based on keywords and punctuation
        const emotions = {
            excitement: 0,
            urgency: 0,
            happiness: 0,
            sadness: 0,
            anger: 0,
            fear: 0,
            surprise: 0,
            uncertainty: 0
        };

        // Excitement and urgency
        emotions.excitement += (text.match(/!/g) || []).length * 0.2;
        emotions.urgency += (text.match(/!/g) || []).length * 0.15;

        // Happiness
        if (text.match(/\b(happy|great|wonderful|excellent|amazing)\b/gi)) {
            emotions.happiness += 0.3;
        }

        // Sadness
        if (text.match(/\b(sad|sorry|unfortunate|regret|disappointed)\b/gi)) {
            emotions.sadness += 0.3;
        }

        // Anger
        if (text.match(/\b(angry|furious|mad|outraged)\b/gi)) {
            emotions.anger += 0.3;
        }

        // Fear
        if (text.match(/\b(afraid|scared|terrified|worried)\b/gi)) {
            emotions.fear += 0.3;
        }

        // Surprise
        if (text.match(/\b(wow|oh|whoa|amazing|incredible)\b/gi)) {
            emotions.surprise += 0.3;
        }

        // Uncertainty
        emotions.uncertainty += (text.match(/\?/g) || []).length * 0.2;
        if (text.match(/\b(maybe|perhaps|possibly|might|could)\b/gi)) {
            emotions.uncertainty += 0.2;
        }

        // Normalize values
        Object.keys(emotions).forEach(emotion => {
            emotions[emotion] = Math.min(emotions[emotion], 1.0);
        });

        return emotions;
    }

    _analyzeTextStructure(text) {
        return {
            totalLength: text.length,
            sentences: (text.match(/[.!?]+/g) || []).length,
            paragraphs: (text.match(/\n\n+/g) || []).length + 1,
            hasDialog: Boolean(text.match(/[""].*?[""]|[''].*?['']|["'].*?["']/g)),
            hasLists: Boolean(text.match(/(?:^|\n)\s*[-*•]|\d+\.|[a-z]\)/gm)),
            hasCode: Boolean(text.match(/(?:^|\n)\s*[{[(]|^\s*\w+\s*=/gm)),
            formalityLevel: this._assessFormality(text)
        };
    }

    _assessFormality(text) {
        const formalWords = text.match(/\b(therefore|however|moreover|furthermore|nevertheless|accordingly)\b/gi) || [];
        const informalWords = text.match(/\b(like|you know|kind of|sort of|basically|pretty much)\b/gi) || [];
        
        if (formalWords.length + informalWords.length === 0) {
            return 0.5;
        }
        return formalWords.length / (formalWords.length + informalWords.length);
    }

    _processSSMLMarkers(text) {
        // Handle breathing markers
        text = text.replace(/<break time="(\d+\.?\d*)s"\/>/g, (_, duration) => {
            return ' '.repeat(Math.ceil(parseFloat(duration) * 5));
        });

        // Handle prosody markers
        text = text.replace(/<prosody ([^>]+)>(.*?)<\/prosody>/g, (_, attrs, content) => {
            return content;
        });

        // Remove all remaining SSML-like tags
        return text.replace(/<\/?[^>]+(>|$)/g, '');
    }

    setOptions(options) {
        this.currentOptions = {
            ...this.currentOptions,
            ...options
        };
    }
}

export default TextProcessorWorker;

// Settings and configuration types
export interface TextProcessingSettings {
    rate: number;
    pitch: number;
    volume: number;
    autoResume: boolean;
    language: string;
}

export interface TextProcessingOptions {
    language?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
}

export interface ExtensionSettings {
    ttsSettings: TextProcessingSettings;
}

export interface InitializationStatus {
    initialized: boolean;
    error?: string;
    timestamp: number;
    context: string;
    details?: Record<string, any>;
}

export interface ContextMenuConfig {
    id: string;
    title: string;
    contexts: chrome.contextMenus.ContextType[];
}

export interface ProcessingResult {
    taskId: string;
    status: string;
    result?: any;
    error?: string;
}

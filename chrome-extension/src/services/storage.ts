import { createLogger } from '../utils/logger';
import { ExtensionSettings, TextProcessingSettings } from '../types/settings';

const logger = createLogger('Storage');

const DEFAULT_SETTINGS: ExtensionSettings = {
    ttsSettings: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        autoResume: true,
        language: 'en'
    }
};

export class StorageService {
    private static instance: StorageService;

    private constructor() {}

    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    public async getSettings(): Promise<ExtensionSettings> {
        try {
            const result = await chrome.storage.local.get('settings');
            return result.settings || DEFAULT_SETTINGS;
        } catch (error) {
            logger.error('Error loading settings:', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return DEFAULT_SETTINGS;
        }
    }

    public async updateSettings(settings: Partial<ExtensionSettings>): Promise<void> {
        try {
            const currentSettings = await this.getSettings();
            const newSettings = {
                ...currentSettings,
                ...settings,
                ttsSettings: {
                    ...currentSettings.ttsSettings,
                    ...(settings.ttsSettings || {})
                }
            };
            await chrome.storage.local.set({ settings: newSettings });
            logger.info('Settings updated successfully');
        } catch (error) {
            logger.error('Error saving settings:', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    public async getTTSSettings(): Promise<TextProcessingSettings> {
        const settings = await this.getSettings();
        return settings.ttsSettings;
    }

    public async updateTTSSettings(settings: Partial<TextProcessingSettings>): Promise<void> {
        const currentSettings = await this.getSettings();
        await this.updateSettings({
            ttsSettings: {
                ...currentSettings.ttsSettings,
                ...settings
            }
        });
    }
}

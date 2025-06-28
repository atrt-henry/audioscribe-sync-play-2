export interface AIProvider {
  id: string;
  name: string;
  icon: string;
  models: AIModel[];
  requiresApiKey: boolean;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  getApiKeyUrl?: string;
}

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  isFree: boolean;
  capabilities: ModelCapability[];
  description?: string;
}

export type ModelCapability = 'speech-to-text' | 'text-generation' | 'translation' | 'summarization';

export interface APIKeySettings {
  [providerId: string]: string;
}

export interface ModelSettings {
  selectedModels: {
    [capability in ModelCapability]?: string;
  };
  enabledProviders: string[];
}

export interface AppSettings {
  apiKeys: APIKeySettings;
  models: ModelSettings;
  preferences: {
    autoTranscribe: boolean;
    defaultLanguage: string;
    transcriptFormat: 'srt' | 'vtt' | 'txt';
  };
}
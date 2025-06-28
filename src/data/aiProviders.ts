import { AIProvider } from '@/types/settings';

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🤖',
    requiresApiKey: true,
    apiKeyLabel: 'DeepSeek API Key',
    apiKeyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    getApiKeyUrl: 'https://platform.deepseek.com/api_keys',
    models: [
      {
        id: 'deepseek-v3',
        name: 'deepseek-v3',
        displayName: 'DeepSeek V3 0324',
        provider: 'deepseek',
        isFree: true,
        capabilities: ['text-generation', 'summarization'],
        description: 'Advanced reasoning and coding capabilities'
      }
    ]
  },
  {
    id: 'codestral',
    name: 'Codestral',
    icon: 'M',
    requiresApiKey: true,
    apiKeyLabel: 'Mistral API Key',
    apiKeyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    getApiKeyUrl: 'https://console.mistral.ai/api-keys/',
    models: [
      {
        id: 'codestral-latest',
        name: 'codestral-latest',
        displayName: 'Codestral (latest)',
        provider: 'codestral',
        isFree: true,
        capabilities: ['text-generation'],
        description: 'Specialized for code generation and completion'
      }
    ]
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '♦',
    requiresApiKey: true,
    apiKeyLabel: 'Gemini API Key',
    apiKeyPlaceholder: 'AIxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    getApiKeyUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      {
        id: 'gemini-2.0-flash-lite',
        name: 'gemini-2.0-flash-lite',
        displayName: 'Gemini 2.0 Flash Lite',
        provider: 'gemini',
        isFree: true,
        capabilities: ['text-generation', 'speech-to-text', 'summarization'],
        description: 'Fast and efficient multimodal model'
      },
      {
        id: 'gemini-1.5-flash',
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        provider: 'gemini',
        isFree: true,
        capabilities: ['text-generation', 'speech-to-text', 'summarization'],
        description: 'Balanced performance and speed'
      },
      {
        id: 'gemini-2.5-flash',
        name: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        provider: 'gemini',
        isFree: true,
        capabilities: ['text-generation', 'speech-to-text', 'summarization'],
        description: 'Latest generation with improved capabilities'
      }
    ]
  },
  {
    id: 'learnlm',
    name: 'LearnLM',
    icon: '♦',
    requiresApiKey: true,
    apiKeyLabel: 'Gemini API Key',
    apiKeyPlaceholder: 'AIxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    getApiKeyUrl: 'https://aistudio.google.com/app/apikey',
    models: [
      {
        id: 'learnlm-2.0-flash',
        name: 'learnlm-2.0-flash',
        displayName: 'LearnLM 2.0 Flash',
        provider: 'learnlm',
        isFree: true,
        capabilities: ['text-generation', 'summarization'],
        description: 'Specialized for educational content and learning'
      }
    ]
  },
  {
    id: 'groq',
    name: 'Groq',
    icon: '⚡',
    requiresApiKey: true,
    apiKeyLabel: 'Groq API Key',
    apiKeyPlaceholder: 'gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    getApiKeyUrl: 'https://console.groq.com/keys',
    models: [
      {
        id: 'whisper-large-v3',
        name: 'whisper-large-v3',
        displayName: 'Whisper Large V3',
        provider: 'groq',
        isFree: true,
        capabilities: ['speech-to-text'],
        description: 'High-quality speech recognition'
      },
      {
        id: 'llama-3.1-70b-versatile',
        name: 'llama-3.1-70b-versatile',
        displayName: 'Llama 3.1 70B',
        provider: 'groq',
        isFree: true,
        capabilities: ['text-generation', 'summarization'],
        description: 'Versatile large language model'
      }
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: 'M',
    requiresApiKey: true,
    apiKeyLabel: 'Mistral API Key',
    apiKeyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    getApiKeyUrl: 'https://console.mistral.ai/api-keys/',
    models: [
      {
        id: 'mistral-large-latest',
        name: 'mistral-large-latest',
        displayName: 'Mistral Large (latest)',
        provider: 'mistral',
        isFree: false,
        capabilities: ['text-generation', 'summarization'],
        description: 'Most capable Mistral model'
      }
    ]
  }
];

export const getProviderById = (id: string): AIProvider | undefined => {
  return AI_PROVIDERS.find(provider => provider.id === id);
};

export const getModelById = (id: string): { model: any; provider: AIProvider } | undefined => {
  for (const provider of AI_PROVIDERS) {
    const model = provider.models.find(m => m.id === id);
    if (model) {
      return { model, provider };
    }
  }
  return undefined;
};

export const getModelsByCapability = (capability: any) => {
  const models: Array<{ model: any; provider: AIProvider }> = [];
  
  AI_PROVIDERS.forEach(provider => {
    provider.models.forEach(model => {
      if (model.capabilities.includes(capability)) {
        models.push({ model, provider });
      }
    });
  });
  
  return models;
};
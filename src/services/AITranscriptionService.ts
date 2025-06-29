import { getModelById } from '@/data/aiProviders';
import { AppSettings } from '@/types/settings';
import { textToSRT } from '@/utils/srtParser';

class AITranscriptionService {
  private static getSettings(): AppSettings | null {
    try {
      const savedSettings = localStorage.getItem('audioscribe_settings');
      return savedSettings ? JSON.parse(savedSettings) : null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  private static cleanTranscriptText(text: string): string {
    // Remove common AI commentary patterns
    const cleanedText = text
      // Remove introductory phrases
      .replace(/^(Here is the|Here's the|This is the|The following is the)\s*(SRT\s*)?(transcription|transcript)\s*(for|of)\s*(the\s*)?(provided\s*)?(audio\s*)?(file|files?)?\s*:?\s*/gi, '')
      // Remove concluding phrases
      .replace(/\s*(That's the|This completes the|End of)\s*(transcription|transcript)\.?\s*$/gi, '')
      // Remove timestamp references in text
      .replace(/\s*\[?\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}\]?\s*/g, ' ')
      // Remove SRT sequence numbers at start of lines
      .replace(/^\d+\s*$/gm, '')
      // Remove empty lines and extra whitespace
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return cleanedText;
  }

  private static async transcribeWithGemini(audioFile: File, apiKey: string, modelId: string): Promise<string> {
    try {
      // Convert audio file to base64
      const base64Audio = await this.fileToBase64(audioFile);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Transcribe this audio file. Return only the spoken text without any introductory phrases, timestamps, or commentary. Do not include phrases like 'Here is the transcription' or similar."
              },
              {
                inline_data: {
                  mime_type: audioFile.type,
                  data: base64Audio
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const rawText = data.candidates[0].content.parts[0].text;
        const cleanedText = this.cleanTranscriptText(rawText);
        
        // Convert to SRT format
        const audio = new Audio(URL.createObjectURL(audioFile));
        await new Promise((resolve) => {
          audio.addEventListener('loadedmetadata', resolve);
        });
        
        const duration = audio.duration || 60;
        return textToSRT(cleanedText, duration);
      } else {
        throw new Error('No transcription content received from Gemini');
      }
    } catch (error) {
      console.error('Gemini transcription error:', error);
      throw error;
    }
  }

  private static async transcribeWithGroq(audioFile: File, apiKey: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'text');
      formData.append('language', 'en'); // Could be made configurable

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        let errorMessage = `Groq API error: ${response.status}`;
        
        try {
          // Try to get the detailed error response
          const errorData = await response.json();
          if (errorData.error) {
            if (errorData.error.message) {
              errorMessage += ` - ${errorData.error.message}`;
            }
            if (errorData.error.type) {
              errorMessage += ` (${errorData.error.type})`;
            }
          }
        } catch (parseError) {
          // If JSON parsing fails, try to get plain text response
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          } catch (textError) {
            // If both fail, just use the status code
            errorMessage += ` - Unable to parse error response`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const transcriptionText = await response.text();
      const cleanedText = this.cleanTranscriptText(transcriptionText);
      
      // Convert plain text to SRT format
      const audio = new Audio(URL.createObjectURL(audioFile));
      await new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', resolve);
      });
      
      const duration = audio.duration || 60; // fallback to 60 seconds
      return textToSRT(cleanedText, duration);
    } catch (error) {
      console.error('Groq transcription error:', error);
      throw error;
    }
  }

  private static async transcribeWithDeepSeek(audioFile: File, apiKey: string): Promise<string> {
    try {
      // DeepSeek doesn't have direct audio transcription, so we'll use it for text processing
      // This is a placeholder - in reality, you'd need to use another service for STT first
      throw new Error('DeepSeek does not support direct audio transcription. Please use Gemini or Groq for speech-to-text.');
    } catch (error) {
      console.error('DeepSeek transcription error:', error);
      throw error;
    }
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/mp3;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private static generateFallbackSRT(duration: number): string {
    // Generate a simple SRT with placeholder text
    const segments = Math.ceil(duration / 10); // 10-second segments
    let srt = '';
    
    for (let i = 0; i < segments; i++) {
      const startTime = i * 10;
      const endTime = Math.min((i + 1) * 10, duration);
      
      const startTimestamp = this.secondsToSRTTimestamp(startTime);
      const endTimestamp = this.secondsToSRTTimestamp(endTime);
      
      srt += `${i + 1}\n`;
      srt += `${startTimestamp} --> ${endTimestamp}\n`;
      srt += `[Transcription segment ${i + 1}]\n\n`;
    }
    
    return srt;
  }

  private static secondsToSRTTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  public static async transcribeAudio(audioFile: File): Promise<string | null> {
    const settings = this.getSettings();
    if (!settings) {
      throw new Error('No settings found. Please configure your AI providers first.');
    }

    // Get the selected speech-to-text model
    const selectedModelId = settings.models.selectedModels['speech-to-text'];
    if (!selectedModelId) {
      throw new Error('No speech-to-text model selected. Please configure your AI models in settings.');
    }

    const modelInfo = getModelById(selectedModelId);
    if (!modelInfo) {
      throw new Error('Selected model not found. Please check your settings.');
    }

    const { model, provider } = modelInfo;
    const apiKey = settings.apiKeys[provider.id];

    if (!apiKey) {
      throw new Error(`No API key configured for ${provider.name}. Please add your API key in settings.`);
    }

    try {
      let transcription: string;

      switch (provider.id) {
        case 'gemini':
        case 'learnlm':
          transcription = await this.transcribeWithGemini(audioFile, apiKey, model.id);
          break;
        
        case 'groq':
          transcription = await this.transcribeWithGroq(audioFile, apiKey);
          break;
        
        case 'deepseek':
          transcription = await this.transcribeWithDeepSeek(audioFile, apiKey);
          break;
        
        default:
          throw new Error(`Transcription not supported for provider: ${provider.name}`);
      }

      // Validate that we got a proper SRT format, if not, try to convert or generate fallback
      if (!transcription || !transcription.includes('-->')) {
        console.warn('Received transcription is not in SRT format, generating fallback...');
        
        // Try to convert plain text to SRT format
        if (transcription && transcription.trim()) {
          const cleanedText = this.cleanTranscriptText(transcription);
          
          // Create a simple SRT with the cleaned text
          const audio = new Audio(URL.createObjectURL(audioFile));
          await new Promise((resolve) => {
            audio.addEventListener('loadedmetadata', resolve);
          });
          
          const duration = audio.duration || 60; // fallback to 60 seconds
          transcription = textToSRT(cleanedText, duration);
        } else {
          // Generate a placeholder SRT
          const audio = new Audio(URL.createObjectURL(audioFile));
          await new Promise((resolve) => {
            audio.addEventListener('loadedmetadata', resolve);
          });
          
          transcription = this.generateFallbackSRT(audio.duration || 60);
        }
      }

      return transcription;
    } catch (error) {
      console.error('Transcription failed:', error);
      throw error;
    }
  }

  public static async isConfigured(): Promise<boolean> {
    const settings = this.getSettings();
    if (!settings) return false;

    const selectedModelId = settings.models.selectedModels['speech-to-text'];
    if (!selectedModelId) return false;

    const modelInfo = getModelById(selectedModelId);
    if (!modelInfo) return false;

    const apiKey = settings.apiKeys[modelInfo.provider.id];
    return !!apiKey;
  }

  public static getConfigurationStatus(): { configured: boolean; message: string } {
    const settings = this.getSettings();
    if (!settings) {
      return { configured: false, message: 'No settings found. Please configure your AI providers.' };
    }

    const selectedModelId = settings.models.selectedModels['speech-to-text'];
    if (!selectedModelId) {
      return { configured: false, message: 'No speech-to-text model selected. Please choose a model in settings.' };
    }

    const modelInfo = getModelById(selectedModelId);
    if (!modelInfo) {
      return { configured: false, message: 'Selected model not found. Please check your settings.' };
    }

    const apiKey = settings.apiKeys[modelInfo.provider.id];
    if (!apiKey) {
      return { configured: false, message: `No API key configured for ${modelInfo.provider.name}.` };
    }

    return { configured: true, message: `Ready to transcribe with ${modelInfo.model.displayName}` };
  }
}

export default AITranscriptionService;
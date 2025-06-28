import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Key,
  Settings,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Info,
  Zap,
  Mic,
  MessageSquare,
  Languages,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { AI_PROVIDERS, getModelsByCapability } from '@/data/aiProviders';
import { AppSettings, ModelCapability } from '@/types/settings';

interface ApiKeySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  apiKeys: {},
  models: {
    selectedModels: {},
    enabledProviders: []
  },
  preferences: {
    autoTranscribe: false,
    defaultLanguage: 'en',
    transcriptFormat: 'srt'
  }
};

const CAPABILITY_ICONS: Record<ModelCapability, React.ReactNode> = {
  'speech-to-text': <Mic className="h-4 w-4" />,
  'text-generation': <MessageSquare className="h-4 w-4" />,
  'translation': <Languages className="h-4 w-4" />,
  'summarization': <FileText className="h-4 w-4" />
};

const CAPABILITY_LABELS: Record<ModelCapability, string> = {
  'speech-to-text': 'Speech to Text',
  'text-generation': 'Text Generation',
  'translation': 'Translation',
  'summarization': 'Summarization'
};

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ open, onOpenChange }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('audioscribe_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    try {
      localStorage.setItem('audioscribe_settings', JSON.stringify(settings));
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  // Reset settings to defaults
  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      setSettings(DEFAULT_SETTINGS);
      setHasChanges(true);
      toast.success('Settings reset to defaults');
    }
  };

  // Update API key
  const updateApiKey = (providerId: string, apiKey: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [providerId]: apiKey
      }
    }));
    setHasChanges(true);
  };

  // Toggle provider enabled state
  const toggleProvider = (providerId: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      models: {
        ...prev.models,
        enabledProviders: enabled
          ? [...prev.models.enabledProviders, providerId]
          : prev.models.enabledProviders.filter(id => id !== providerId)
      }
    }));
    setHasChanges(true);
  };

  // Update selected model for capability
  const updateSelectedModel = (capability: ModelCapability, modelId: string) => {
    setSettings(prev => ({
      ...prev,
      models: {
        ...prev.models,
        selectedModels: {
          ...prev.models.selectedModels,
          [capability]: modelId
        }
      }
    }));
    setHasChanges(true);
  };

  // Update preferences
  const updatePreference = (key: keyof AppSettings['preferences'], value: any) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  // Toggle API key visibility
  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  // Mask API key for display
  const maskApiKey = (apiKey: string): string => {
    if (apiKey.length <= 8) return apiKey;
    return apiKey.slice(0, 4) + '•'.repeat(apiKey.length - 8) + apiKey.slice(-4);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Models & API Keys
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="models" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            <TabsContent value="models" className="space-y-4">
              <div className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Select your preferred AI models for different capabilities. Make sure to configure the corresponding API keys in the Providers tab.
                  </AlertDescription>
                </Alert>

                {(['speech-to-text', 'text-generation', 'summarization', 'translation'] as ModelCapability[]).map(capability => {
                  const availableModels = getModelsByCapability(capability);
                  const selectedModelId = settings.models.selectedModels[capability];
                  
                  return (
                    <Card key={capability}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {CAPABILITY_ICONS[capability]}
                          {CAPABILITY_LABELS[capability]}
                          <Badge variant="outline">{availableModels.length} available</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`model-${capability}`}>Selected Model</Label>
                            <Select
                              value={selectedModelId || ''}
                              onValueChange={(value) => updateSelectedModel(capability, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a model..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableModels.map(({ model, provider }) => (
                                  <SelectItem key={model.id} value={model.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{provider.icon}</span>
                                      <span>{model.displayName}</span>
                                      {model.isFree && (
                                        <Badge variant="secondary" className="text-xs">Free</Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {selectedModelId && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {availableModels.map(({ model, provider }) => (
                                <div
                                  key={model.id}
                                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                                    model.id === selectedModelId
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border hover:border-primary/50'
                                  }`}
                                  onClick={() => updateSelectedModel(capability, model.id)}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="text-lg">{provider.icon}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm truncate">{model.displayName}</h4>
                                        {model.isFree && (
                                          <Badge variant="secondary" className="text-xs">Free</Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {model.description}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        by {provider.name}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="providers" className="space-y-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  Configure your API keys for different AI providers. API keys are stored locally in your browser.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {AI_PROVIDERS.map(provider => {
                  const isEnabled = settings.models.enabledProviders.includes(provider.id);
                  const apiKey = settings.apiKeys[provider.id] || '';
                  const showKey = showApiKeys[provider.id] || false;

                  return (
                    <Card key={provider.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{provider.icon}</span>
                            <div>
                              <CardTitle className="text-lg">{provider.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {provider.models.length} models
                                </Badge>
                                {provider.models.some(m => m.isFree) && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Free tier
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => toggleProvider(provider.id, checked)}
                          />
                        </div>
                      </CardHeader>

                      {isEnabled && (
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`api-key-${provider.id}`}>
                                {provider.apiKeyLabel}
                              </Label>
                              {provider.getApiKeyUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="h-auto p-1 text-xs"
                                >
                                  <a
                                    href={provider.getApiKeyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                  >
                                    Get API Key
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                              )}
                            </div>
                            
                            <div className="relative">
                              <Input
                                id={`api-key-${provider.id}`}
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => updateApiKey(provider.id, e.target.value)}
                                placeholder={provider.apiKeyPlaceholder}
                                className="pr-10"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                onClick={() => toggleApiKeyVisibility(provider.id)}
                              >
                                {showKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="font-medium text-sm mb-2">Available Models</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {provider.models.map(model => (
                                <div
                                  key={model.id}
                                  className="flex items-center justify-between p-2 rounded border"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{model.displayName}</span>
                                      {model.isFree && (
                                        <Badge variant="secondary" className="text-xs">Free</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      {model.capabilities.map(capability => (
                                        <Badge key={capability} variant="outline" className="text-xs">
                                          {CAPABILITY_LABELS[capability]}
                                        </Badge>
                                      ))}
                                    </div>
                                    {model.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {model.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-transcribe">Auto-transcribe uploaded audio</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically generate transcripts when audio files are uploaded
                      </p>
                    </div>
                    <Switch
                      id="auto-transcribe"
                      checked={settings.preferences.autoTranscribe}
                      onCheckedChange={(checked) => updatePreference('autoTranscribe', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="default-language">Default Language</Label>
                    <Select
                      value={settings.preferences.defaultLanguage}
                      onValueChange={(value) => updatePreference('defaultLanguage', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="ru">Russian</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transcript-format">Default Transcript Format</Label>
                    <Select
                      value={settings.preferences.transcriptFormat}
                      onValueChange={(value: 'srt' | 'vtt' | 'txt') => updatePreference('transcriptFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="srt">SRT (SubRip)</SelectItem>
                        <SelectItem value="vtt">VTT (WebVTT)</SelectItem>
                        <SelectItem value="txt">Plain Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={resetSettings}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            
            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-sm text-muted-foreground">
                  You have unsaved changes
                </span>
              )}
              <Button onClick={saveSettings} disabled={!hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeySettings;
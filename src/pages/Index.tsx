import { useState, useRef, useEffect } from 'react';
import MultiAudioManager from '@/components/MultiAudioManager';
import ApiKeySettings from '@/components/ApiKeySettings';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Library, Settings, Sparkles } from 'lucide-react';

const Index = () => {
  const [isPopout, setIsPopout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Determine if we're running as a popup or within the extension
  useEffect(() => {
    const isPopupWindow = window.opener !== null;
    setIsPopout(isPopupWindow);
  }, []);

  const handlePopout = () => {
    const width = 1200;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      window.location.href,
      'AudioScribePlayer',
      `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars=yes,status=no`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background/98 to-muted/30">
      {/* Header */}
      <div className="app-header px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-20"></div>
              <div className="relative bg-gradient-to-r from-primary to-accent p-2 rounded-lg">
                <Music className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AudioScribe
              </h1>
              <p className="text-xs text-muted-foreground">AI-Powered Audio Transcription</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Settings Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 glass-effect hover:bg-primary/10 focus-ring"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>

            {!isPopout && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePopout}
                className="flex items-center gap-2 glass-effect hover:bg-accent/10 focus-ring"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Pop Out
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {!isPopout ? (
          <ScrollArea className="h-[calc(100vh-89px)] custom-scrollbar">
            <div className="p-6">
              <MultiAudioManager />
            </div>
          </ScrollArea>
        ) : (
          <div className="h-full p-6">
            <MultiAudioManager />
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <ApiKeySettings 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </div>
  );
};

export default Index;
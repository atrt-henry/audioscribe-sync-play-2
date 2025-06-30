import { useState, useRef, useEffect } from 'react';
import MultiAudioManager from '@/components/MultiAudioManager';
import ApiKeySettings from '@/components/ApiKeySettings';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Library, Settings } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">AudioScribe</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Settings Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>

            {!isPopout && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePopout}
                className="flex items-center gap-2"
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
          <ScrollArea className="h-[calc(100vh-73px)]">
            <div className="p-4">
              <MultiAudioManager />
            </div>
          </ScrollArea>
        ) : (
          <div className="h-full p-4">
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

import { useState, useRef, useEffect } from 'react';
import AudioPlayer from '@/components/AudioPlayer';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Rnd } from 'react-rnd';

const MIN_WIDTH = 400;
const MIN_HEIGHT = 500;

const Index = () => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPopout, setIsPopout] = useState(false);

  // Determine if we're running as a popup or within the extension
  useEffect(() => {
    const isPopupWindow = window.opener !== null;
    setIsPopout(isPopupWindow);
  }, []);

  const handlePopout = () => {
    const width = 600;
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
    <div className="min-h-screen flex flex-col p-4 sm:p-6 md:p-8 bg-gray-50">
      {/* For extension popup mode */}
      {!isPopout && (
        <div className="max-w-4xl w-full mx-auto">
          <div className="flex justify-end mb-2">
            <button
              onClick={handlePopout}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
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
            </button>
          </div>

          <ScrollArea className="h-[600px] rounded-md border">
            <div className="p-4">
              <AudioPlayer />
            </div>
          </ScrollArea>
        </div>
      )}

      {/* For popped out window */}
      {isPopout && (
        <div className="w-full h-full">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={100}>
              <div className="h-full p-4">
                <AudioPlayer />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}
    </div>
  );
};

export default Index;

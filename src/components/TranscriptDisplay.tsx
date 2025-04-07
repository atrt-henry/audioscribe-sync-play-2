
import React, { useRef, useEffect } from 'react';
import { SubtitleSegment } from '@/utils/srtParser';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TranscriptDisplayProps {
  segments: SubtitleSegment[];
  currentSegment: SubtitleSegment | null;
  onSegmentClick: (segment: SubtitleSegment) => void;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  segments,
  currentSegment,
  onSegmentClick,
}) => {
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSegmentRef.current) {
      // Scroll the active segment into view smoothly
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSegment]);

  if (segments.length === 0) {
    return (
      <div className="transcript-container flex items-center justify-center text-gray-500 h-[200px]">
        <p>No transcript loaded. Please upload an SRT file.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px] rounded-md border">
      <div className="transcript-container p-4">
        {segments.map((segment) => (
          <div
            key={segment.id}
            ref={currentSegment?.id === segment.id ? activeSegmentRef : null}
            className={`transcript-line ${
              currentSegment?.id === segment.id ? 'active' : ''
            }`}
            onClick={() => onSegmentClick(segment)}
          >
            {segment.text}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default TranscriptDisplay;

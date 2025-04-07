
import React, { useRef, useEffect } from 'react';
import { SubtitleSegment } from '@/utils/srtParser';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSegmentRef.current && containerRef.current) {
      // Scroll the active segment into view smoothly
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSegment]);

  if (segments.length === 0) {
    return (
      <div className="transcript-container flex items-center justify-center text-gray-500 h-[300px]">
        <p>No transcript loaded. Please upload an SRT file.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="transcript-container scroll-smooth">
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
  );
};

export default TranscriptDisplay;

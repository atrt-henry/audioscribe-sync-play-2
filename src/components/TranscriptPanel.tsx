import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Edit3, 
  Save, 
  Download, 
  X, 
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseSRT, findCurrentSegment, SubtitleSegment, formatTime } from '@/utils/srtParser';

interface TranscriptPanelProps {
  transcript: string;
  currentTime: number;
  onSeek: (time: number) => void;
  onTranscriptUpdate: (transcript: string) => void;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcript,
  currentTime,
  onSeek,
  onTranscriptUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState<SubtitleSegment | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  
  const transcriptRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Parse transcript into segments
    try {
      const parsedSegments = parseSRT(transcript);
      setSegments(parsedSegments);
    } catch (error) {
      console.error('Error parsing transcript:', error);
      setSegments([]);
    }
  }, [transcript]);

  useEffect(() => {
    // Update current segment based on time
    if (segments.length > 0) {
      const segment = findCurrentSegment(segments, currentTime);
      setCurrentSegment(segment);
    }
  }, [segments, currentTime]);

  useEffect(() => {
    // Auto-scroll to active segment with smooth behavior
    if (activeSegmentRef.current && currentSegment) {
      const container = transcriptRef.current;
      const element = activeSegmentRef.current;
      
      if (container && element) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        // Check if element is not fully visible
        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }
    }
  }, [currentSegment]);

  const handleSave = () => {
    onTranscriptUpdate(editedTranscript);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTranscript(transcript);
    setIsEditing(false);
  };

  const handleSegmentClick = (segment: SubtitleSegment, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Provide visual feedback
    const target = event.currentTarget as HTMLElement;
    target.style.transform = 'scale(0.98)';
    setTimeout(() => {
      target.style.transform = '';
    }, 150);
    
    // Seek to the segment start time
    onSeek(segment.startTime);
  };

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Interactive Transcript
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
              title="Download transcript"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 w-8 p-0"
              title="Edit transcript"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="Enter transcript content..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Transcript Segments */}
            <div 
              ref={transcriptRef}
              className="max-h-[400px] overflow-y-auto space-y-1 custom-scrollbar"
            >
              {segments.length > 0 ? (
                segments.map((segment, index) => {
                  const isActive = currentSegment?.id === segment.id;
                  const isHovered = hoveredSegment === index;
                  
                  return (
                    <div
                      key={segment.id}
                      ref={isActive ? activeSegmentRef : null}
                      className={cn(
                        "group p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                        "hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]",
                        isActive && "bg-primary/10 border-primary/30 shadow-sm",
                        !isActive && isHovered && "bg-muted/50 border-muted-foreground/20",
                        !isActive && !isHovered && "border-transparent hover:border-muted-foreground/20"
                      )}
                      onClick={(e) => handleSegmentClick(segment, e)}
                      onMouseEnter={() => setHoveredSegment(index)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Text Content */}
                        <div className={cn(
                          "flex-1 text-sm leading-relaxed transition-colors select-text",
                          isActive && "font-medium text-foreground"
                        )}>
                          {segment.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No transcript segments found</p>
                  <p className="text-xs mt-1">
                    Make sure the transcript is in SRT format with timestamps
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TranscriptPanel;
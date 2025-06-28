import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Edit3, 
  Save, 
  Download, 
  X, 
  ChevronUp, 
  ChevronDown,
  Play,
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
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

  useEffect(() => {
    // Perform search
    if (searchTerm.trim()) {
      const results: number[] = [];
      segments.forEach((segment, index) => {
        if (segment.text.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push(index);
        }
      });
      setSearchResults(results);
      setCurrentSearchIndex(results.length > 0 ? 0 : -1);
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
    }
  }, [searchTerm, segments]);

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

  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = currentSearchIndex <= 0 
        ? searchResults.length - 1 
        : currentSearchIndex - 1;
    }
    
    setCurrentSearchIndex(newIndex);
    
    // Scroll to search result and seek to that time
    const segmentIndex = searchResults[newIndex];
    const segment = segments[segmentIndex];
    if (segment) {
      onSeek(segment.startTime);
    }
  };

  const highlightText = (text: string, searchTerm: string): React.ReactNode => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
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
            {segments.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {segments.length} segments
              </Badge>
            )}
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

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transcript..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {currentSearchIndex + 1} of {searchResults.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateSearch('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateSearch('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
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
            {/* Instructions */}
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Click on any transcript segment to jump to that time in the audio
              </p>
            </div>

            {/* Transcript Segments */}
            <div 
              ref={transcriptRef}
              className="max-h-[400px] overflow-y-auto space-y-1 custom-scrollbar"
            >
              {segments.length > 0 ? (
                segments.map((segment, index) => {
                  const isActive = currentSegment?.id === segment.id;
                  const isSearchResult = searchResults.includes(index);
                  const isCurrentSearchResult = searchResults[currentSearchIndex] === index;
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
                        !isActive && !isHovered && "border-transparent hover:border-muted-foreground/20",
                        isCurrentSearchResult && "ring-2 ring-yellow-400 ring-offset-2"
                      )}
                      onClick={(e) => handleSegmentClick(segment, e)}
                      onMouseEnter={() => setHoveredSegment(index)}
                      onMouseLeave={() => setHoveredSegment(null)}
                      title={`Click to jump to ${formatTime(segment.startTime)}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Timestamp */}
                        <div className={cn(
                          "text-xs font-mono min-w-[80px] flex items-center gap-1 transition-colors",
                          isActive ? "text-primary font-medium" : "text-muted-foreground",
                          isHovered && "text-foreground"
                        )}>
                          <Clock className="h-3 w-3" />
                          {formatTime(segment.startTime)}
                        </div>
                        
                        {/* Text Content */}
                        <div className={cn(
                          "flex-1 text-sm leading-relaxed transition-colors select-text",
                          isActive && "font-medium text-foreground"
                        )}>
                          {highlightText(segment.text, searchTerm)}
                        </div>

                        {/* Play Icon on Hover */}
                        <div className={cn(
                          "opacity-0 group-hover:opacity-100 transition-opacity",
                          isActive && "opacity-100"
                        )}>
                          <Play className={cn(
                            "h-4 w-4 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                      </div>

                      {/* Progress Bar for Active Segment */}
                      {isActive && (
                        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{
                              width: `${Math.min(100, Math.max(0, 
                                ((currentTime - segment.startTime) / (segment.endTime - segment.startTime)) * 100
                              ))}%`
                            }}
                          />
                        </div>
                      )}
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
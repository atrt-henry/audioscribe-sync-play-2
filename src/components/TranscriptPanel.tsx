import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3, 
  Save, 
  Download, 
  X, 
  Clock,
  Merge,
  Split,
  Timer,
  Play,
  Trash2,
  Plus,
  Undo,
  Redo,
  Keyboard,
  FileText,
  MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { 
  parseSRT, 
  findCurrentSegment, 
  SubtitleSegment, 
  formatTime, 
  segmentsToSRT,
  mergeSegments,
  splitSegment,
  updateSegmentTiming,
  updateSegmentText,
  deleteSegment,
  addSegment
} from '@/utils/srtParser';

interface TranscriptPanelProps {
  transcript: string;
  currentTime: number;
  onSeek: (time: number) => void;
  onTranscriptUpdate: (transcript: string) => void;
  audioFileName?: string;
}

interface HistoryState {
  segments: SubtitleSegment[];
  timestamp: number;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcript,
  currentTime,
  onSeek,
  onTranscriptUpdate,
  audioFileName
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState<SubtitleSegment | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<number[]>([]);
  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  
  // CRITICAL FIX: Track click state to prevent glitch
  const [isSeekingFromClick, setIsSeekingFromClick] = useState(false);
  const [targetSegmentId, setTargetSegmentId] = useState<number | null>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Undo/Redo state
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const transcriptRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Save state to history
  const saveToHistory = useCallback((newSegments: SubtitleSegment[]) => {
    const newState: HistoryState = {
      segments: JSON.parse(JSON.stringify(newSegments)), // Deep clone
      timestamp: Date.now()
    };
    
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  // Update segments with history tracking
  const updateSegments = useCallback((newSegments: SubtitleSegment[]) => {
    setSegments(newSegments);
    saveToHistory(newSegments);
  }, [saveToHistory]);

  useEffect(() => {
    // Parse transcript into segments and filter out empty ones
    try {
      const parsedSegments = parseSRT(transcript);
      const validSegments = parsedSegments.filter(seg => seg.text.trim().length > 0);
      setSegments(validSegments);
      
      // Initialize history
      if (validSegments.length > 0) {
        const initialState: HistoryState = {
          segments: JSON.parse(JSON.stringify(validSegments)),
          timestamp: Date.now()
        };
        setHistory([initialState]);
        setHistoryIndex(0);
      }
    } catch (error) {
      console.error('Error parsing transcript:', error);
      setSegments([]);
    }
  }, [transcript]);

  useEffect(() => {
    // CRITICAL FIX: Only update current segment if not seeking from click
    if (segments.length > 0 && !isSeekingFromClick) {
      const segment = findCurrentSegment(segments, currentTime);
      setCurrentSegment(segment);
    }
  }, [segments, currentTime, isSeekingFromClick]);

  // CRITICAL FIX: Handle seek completion
  useEffect(() => {
    if (isSeekingFromClick && targetSegmentId) {
      // Clear any existing timeout
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      
      // Set a timeout to reset the seeking state
      seekTimeoutRef.current = setTimeout(() => {
        setIsSeekingFromClick(false);
        
        // Now find the correct current segment
        const segment = findCurrentSegment(segments, currentTime);
        setCurrentSegment(segment);
        
        setTargetSegmentId(null);
      }, 100); // Small delay to ensure seek has completed
    }
  }, [isSeekingFromClick, targetSegmentId, segments, currentTime]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to active segment with smooth behavior
    if (activeSegmentRef.current && currentSegment && !isEditing && !isSyncing) {
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
  }, [currentSegment, isEditing, isSyncing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when in editing or syncing mode
      if (!isEditing && !isSyncing) return;
      
      // Prevent shortcuts when typing in textarea
      if (event.target instanceof HTMLTextAreaElement) return;
      
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            event.preventDefault();
            handleRedo();
            break;
          case 's':
            event.preventDefault();
            handleSave();
            break;
        }
      } else {
        switch (event.key.toLowerCase()) {
          case 'm':
            if (isSyncing) {
              event.preventDefault();
              // Mark current segment at current time
              if (currentSegment) {
                const updatedSegments = updateSegmentTiming(segments, currentSegment.id, currentTime);
                updateSegments(updatedSegments);
              }
            }
            break;
          case 'escape':
            event.preventDefault();
            handleCancel();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, isSyncing, segments, currentSegment, currentTime, history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSegments(history[newIndex].segments);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSegments(history[newIndex].segments);
    }
  };

  const handleSave = () => {
    if (isEditing || isSyncing) {
      // Filter out empty segments before saving
      const validSegments = segments.filter(seg => seg.text.trim().length > 0);
      const updatedSRT = segmentsToSRT(validSegments);
      onTranscriptUpdate(updatedSRT);
      setIsEditing(false);
      setIsSyncing(false);
      setSelectedSegments([]);
    }
  };

  const handleCancel = () => {
    if (isEditing || isSyncing) {
      // Reload original segments
      const parsedSegments = parseSRT(transcript);
      const validSegments = parsedSegments.filter(seg => seg.text.trim().length > 0);
      setSegments(validSegments);
      setIsEditing(false);
      setIsSyncing(false);
      setSelectedSegments([]);
    }
    setEditingSegmentId(null);
    setEditingText('');
  };

  const handleSegmentClick = (segment: SubtitleSegment, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isSyncing) {
      // Manual sync mode: clicking marks the end of this segment
      const updatedSegments = updateSegmentTiming(segments, segment.id, currentTime);
      updateSegments(updatedSegments);
      
      // Provide visual feedback
      const target = event.currentTarget as HTMLElement;
      target.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
      setTimeout(() => {
        target.style.backgroundColor = '';
      }, 500);
    } else if (isEditing) {
      // Edit mode: toggle segment selection or start text editing
      if (event.detail === 2) { // Double click to edit text
        setEditingSegmentId(segment.id);
        setEditingText(segment.text);
      } else { // Single click to select
        setSelectedSegments(prev => 
          prev.includes(segment.id) 
            ? prev.filter(id => id !== segment.id)
            : [...prev, segment.id]
        );
      }
    } else {
      // CRITICAL FIX: Normal mode seeking with glitch prevention
      
      // 1. Immediately set the target segment as current to prevent glitch
      setCurrentSegment(segment);
      
      // 2. Set seeking state to prevent automatic current segment updates
      setIsSeekingFromClick(true);
      setTargetSegmentId(segment.id);
      
      // 3. Perform the seek
      onSeek(segment.startTime);
      
      // 4. Provide visual feedback
      const target = event.currentTarget as HTMLElement;
      target.style.transform = 'scale(0.98)';
      setTimeout(() => {
        target.style.transform = '';
      }, 150);
    }
  };

  const handleTextEdit = (segmentId: number, newText: string) => {
    if (newText.trim().length === 0) {
      // Delete the segment if text is empty
      const updatedSegments = deleteSegment(segments, segmentId);
      updateSegments(updatedSegments);
    } else {
      // Update the segment text
      const updatedSegments = updateSegmentText(segments, segmentId, newText);
      updateSegments(updatedSegments);
    }
    setEditingSegmentId(null);
    setEditingText('');
  };

  const handleDeleteSegment = (segmentId: number) => {
    const updatedSegments = deleteSegment(segments, segmentId);
    updateSegments(updatedSegments);
    setSelectedSegments(prev => prev.filter(id => id !== segmentId));
  };

  const handleMergeSegments = () => {
    if (selectedSegments.length < 2) return;
    
    const updatedSegments = mergeSegments(segments, selectedSegments);
    updateSegments(updatedSegments);
    setSelectedSegments([]);
  };

  const handleSplitSegment = (segmentId: number) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;
    
    // Split at the middle of the segment duration
    const splitTime = segment.startTime + (segment.endTime - segment.startTime) / 2;
    const updatedSegments = splitSegment(segments, segmentId, splitTime);
    updateSegments(updatedSegments);
  };

  const handleAddSegment = (position: 'before' | 'after', segmentId: number) => {
    const segmentIndex = segments.findIndex(s => s.id === segmentId);
    if (segmentIndex === -1) return;
    
    const insertIndex = position === 'before' ? segmentIndex : segmentIndex + 1;
    const updatedSegments = addSegment(segments, insertIndex, 'New segment', 5);
    updateSegments(updatedSegments);
  };

  const handleDownload = () => {
    // Use audio file name for transcript download
    const fileName = audioFileName 
      ? audioFileName.replace(/\.[^/.]+$/, '') + '.srt'
      : 'transcript.srt';
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startSyncMode = () => {
    setIsSyncing(true);
    setIsEditing(false);
    setSelectedSegments([]);
    setEditingSegmentId(null);
    
    // Pause and reset to beginning
    onSeek(0);
  };

  const startEditMode = () => {
    setIsEditing(true);
    setIsSyncing(false);
    setSelectedSegments([]);
    setEditingSegmentId(null);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Interactive Transcript
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Undo/Redo buttons */}
            {(isEditing || isSyncing) && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="h-8 w-8 p-0"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="h-8 w-8 p-0"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </>
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
              variant={isSyncing ? "default" : "ghost"}
              size="sm"
              onClick={startSyncMode}
              className="h-8 px-3"
              title="Manual sync mode"
            >
              <Timer className="h-4 w-4 mr-1" />
              Sync
            </Button>
            <Button
              variant={isEditing ? "default" : "ghost"}
              size="sm"
              onClick={startEditMode}
              className="h-8 px-3"
              title="Edit mode"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        {/* Mode Instructions */}
        {(isEditing || isSyncing) && (
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            {isSyncing && (
              <div className="space-y-1">
                <p className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  <strong>Sync Mode:</strong> Play audio and click segments to mark their end time. Each click sets the end of that segment and start of the next.
                </p>
                <p className="flex items-center gap-2 text-xs">
                  <Keyboard className="h-3 w-3" />
                  Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">M</kbd> to mark current segment at current time
                </p>
              </div>
            )}
            {isEditing && (
              <div className="space-y-1">
                <p className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  <strong>Edit Mode:</strong> Double-click to edit text, single-click to select segments for merging. Delete all text to remove segment.
                </p>
                <p className="flex items-center gap-2 text-xs">
                  <Keyboard className="h-3 w-3" />
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Z</kbd> Undo • 
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Y</kbd> Redo • 
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+S</kbd> Save • 
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> Cancel
                </p>
                {selectedSegments.length > 1 && (
                  <p className="text-xs">
                    {selectedSegments.length} segments selected for merging
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isEditing && !isSyncing ? (
          <div className="space-y-4">
            {/* Edit Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMergeSegments}
                disabled={selectedSegments.length < 2}
                className="flex items-center gap-2"
              >
                <Merge className="h-4 w-4" />
                Merge Selected ({selectedSegments.length})
              </Button>
            </div>

            {/* Editable Segments - NO TIMESTAMPS IN EDIT MODE */}
            <div 
              ref={transcriptRef}
              className="max-h-[400px] overflow-y-auto space-y-1 custom-scrollbar"
            >
              {segments.map((segment, index) => {
                const isActive = currentSegment?.id === segment.id;
                const isSelected = selectedSegments.includes(segment.id);
                const isEditingThis = editingSegmentId === segment.id;
                
                return (
                  <div
                    key={segment.id}
                    ref={isActive ? activeSegmentRef : null}
                    className={cn(
                      "group p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                      "hover:shadow-sm",
                      isActive && "bg-primary/10 border-primary/30",
                      isSelected && "bg-blue-100 border-blue-300",
                      !isActive && !isSelected && "border-transparent hover:border-muted-foreground/20"
                    )}
                    onClick={(e) => handleSegmentClick(segment, e)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Text Content - Full width in edit mode */}
                      <div className="flex-1">
                        {isEditingThis ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="min-h-[60px] text-sm"
                              autoFocus
                              placeholder="Delete all text to remove this segment"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleTextEdit(segment.id, editingText)}
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingSegmentId(null);
                                  setEditingText('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm leading-relaxed select-text">
                            {segment.text}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAddSegment('before', segment.id)}>
                              Add new segment before
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddSegment('after', segment.id)}>
                              Add new segment after
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSplitSegment(segment.id);
                          }}
                          className="h-6 w-6 p-0"
                          title="Split segment"
                        >
                          <Split className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSegment(segment.id);
                          }}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          title="Delete segment"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        ) : isSyncing ? (
          <div className="space-y-4">
            {/* Sync Mode Segments */}
            <div 
              ref={transcriptRef}
              className="max-h-[400px] overflow-y-auto space-y-1 custom-scrollbar"
            >
              {segments.map((segment, index) => {
                const isActive = currentSegment?.id === segment.id;
                
                return (
                  <div
                    key={segment.id}
                    ref={isActive ? activeSegmentRef : null}
                    className={cn(
                      "group p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                      "hover:shadow-sm hover:bg-green-50 hover:border-green-300",
                      isActive && "bg-primary/10 border-primary/30 ring-2 ring-primary/20",
                      !isActive && "border-transparent"
                    )}
                    onClick={(e) => handleSegmentClick(segment, e)}
                    title="Click to mark end of this segment"
                  >
                    <div className="flex items-start gap-3">
                      {/* Timestamp */}
                      <div className={cn(
                        "text-xs font-mono min-w-[80px] flex items-center gap-1 transition-colors",
                        isActive ? "text-primary font-medium" : "text-muted-foreground"
                      )}>
                        <Clock className="h-3 w-3" />
                        {formatTime(segment.startTime)}
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 text-sm leading-relaxed">
                        {segment.text}
                      </div>
                      
                      {/* Sync Indicator */}
                      <div className="text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to sync
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Timing
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

            {/* Normal View Segments */}
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
                      title={`Click to jump to ${formatTime(segment.startTime)}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Text Content */}
                        <div className={cn(
                          "flex-1 text-sm leading-relaxed transition-colors select-text",
                          isActive && "font-medium text-foreground"
                        )}>
                          {segment.text}
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
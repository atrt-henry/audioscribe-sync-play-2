import React, { useState, useRef, useEffect } from 'react';
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
  Undo,
  Redo,
  Plus
} from 'lucide-react';
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
  addLineBreak,
  TranscriptHistory
} from '@/utils/srtParser';

interface TranscriptPanelProps {
  transcript: string;
  currentTime: number;
  onSeek: (time: number) => void;
  onTranscriptUpdate: (transcript: string) => void;
  audioFileName?: string;
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
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const transcriptRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef(new TranscriptHistory());

  useEffect(() => {
    // Parse transcript into segments and filter out empty ones
    try {
      const parsedSegments = parseSRT(transcript);
      const validSegments = parsedSegments.filter(seg => seg.text.trim().length > 0);
      setSegments(validSegments);
      
      // Save initial state to history
      if (validSegments.length > 0) {
        historyRef.current.clear();
        historyRef.current.saveState(validSegments);
      }
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
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not editing text
      if (editingSegmentId !== null) return;
      
      if ((e.ctrlKey || e.metaKey)) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              handleRedo();
            } else {
              e.preventDefault();
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
        }
      } else if (isSyncing) {
        // Space bar to mark segment in sync mode
        if (e.code === 'Space' && currentSegment) {
          e.preventDefault();
          handleSegmentSync(currentSegment);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingSegmentId, isSyncing, currentSegment, segments]);

  const saveToHistory = (newSegments: SubtitleSegment[]) => {
    historyRef.current.saveState(newSegments);
  };

  const handleUndo = () => {
    const previousState = historyRef.current.undo();
    if (previousState) {
      setSegments(previousState);
    }
  };

  const handleRedo = () => {
    const nextState = historyRef.current.redo();
    if (nextState) {
      setSegments(nextState);
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
      handleSegmentSync(segment, event);
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
      // Normal mode: seek to segment
      const target = event.currentTarget as HTMLElement;
      target.style.transform = 'scale(0.98)';
      setTimeout(() => {
        target.style.transform = '';
      }, 150);
      
      onSeek(segment.startTime);
    }
  };

  const handleSegmentSync = (segment: SubtitleSegment, event?: React.MouseEvent) => {
    // Manual sync mode: clicking marks the end of this segment
    const updatedSegments = updateSegmentTiming(segments, segment.id, currentTime);
    setSegments(updatedSegments);
    saveToHistory(updatedSegments);
    
    // Provide visual feedback
    if (event) {
      const target = event.currentTarget as HTMLElement;
      target.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
      setTimeout(() => {
        target.style.backgroundColor = '';
      }, 500);
    }
  };

  const handleTextEdit = (segmentId: number, newText: string) => {
    if (newText.trim().length === 0) {
      // Delete the segment if text is empty
      const updatedSegments = deleteSegment(segments, segmentId);
      setSegments(updatedSegments);
      saveToHistory(updatedSegments);
    } else {
      // Update the segment text
      const updatedSegments = updateSegmentText(segments, segmentId, newText);
      setSegments(updatedSegments);
      saveToHistory(updatedSegments);
    }
    setEditingSegmentId(null);
    setEditingText('');
  };

  const handleDeleteSegment = (segmentId: number) => {
    const updatedSegments = deleteSegment(segments, segmentId);
    setSegments(updatedSegments);
    saveToHistory(updatedSegments);
    setSelectedSegments(prev => prev.filter(id => id !== segmentId));
  };

  const handleMergeSegments = () => {
    if (selectedSegments.length < 2) return;
    
    const updatedSegments = mergeSegments(segments, selectedSegments);
    setSegments(updatedSegments);
    saveToHistory(updatedSegments);
    setSelectedSegments([]);
  };

  const handleSplitSegment = (segmentId: number) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;
    
    // Split at the middle of the segment duration
    const splitTime = segment.startTime + (segment.endTime - segment.startTime) / 2;
    const updatedSegments = splitSegment(segments, segmentId, splitTime);
    setSegments(updatedSegments);
    saveToHistory(updatedSegments);
  };

  const handleAddLineBreak = () => {
    if (editingSegmentId !== null && textareaRef.current) {
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const newText = addLineBreak(editingText, cursorPos);
      setEditingText(newText);
      
      // Restore cursor position after line break
      setTimeout(() => {
        if (textarea) {
          textarea.selectionStart = textarea.selectionEnd = cursorPos + 1;
          textarea.focus();
        }
      }, 0);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingText(e.target.value);
    setCursorPosition(e.target.selectionStart);
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
            <Clock className="h-5 w-5" />
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
                  disabled={!historyRef.current.canUndo()}
                  className="h-8 w-8 p-0"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={!historyRef.current.canRedo()}
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
                <p className="text-xs">
                  Keyboard: <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> to mark current segment
                </p>
              </div>
            )}
            {isEditing && (
              <div className="space-y-1">
                <p className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  <strong>Edit Mode:</strong> Double-click to edit text, single-click to select segments for merging. Delete all text to remove segment.
                </p>
                <p className="text-xs">
                  Keyboard: <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Z</kbd> Undo, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Y</kbd> Redo, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+S</kbd> Save
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
            <div className="flex items-center gap-2">
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

            {/* Editable Segments */}
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
                      {/* Text Content */}
                      <div className="flex-1">
                        {isEditingThis ? (
                          <div className="space-y-2">
                            <div className="relative">
                              <Textarea
                                ref={textareaRef}
                                value={editingText}
                                onChange={handleTextareaChange}
                                className="min-h-[60px] text-sm"
                                autoFocus
                                placeholder="Delete all text to remove this segment"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAddLineBreak}
                                className="absolute top-2 right-2 h-6 w-6 p-0"
                                title="Add line break"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
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
                          <div className="text-sm leading-relaxed select-text whitespace-pre-wrap">
                            {segment.text}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    title="Click to mark end of this segment (or press Space)"
                  >
                    <div className="flex items-start gap-3">
                      {/* Timestamp */}
                      <div className="text-xs font-mono min-w-[120px] flex flex-col gap-1 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                        </div>
                        <div className="text-xs text-green-600">
                          {isActive ? 'Press Space or Click' : 'Click to sync'}
                        </div>
                      </div>
                      
                      {/* Text Content */}
                      <div className="flex-1 text-sm leading-relaxed whitespace-pre-wrap">
                        {segment.text}
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
                          "flex-1 text-sm leading-relaxed transition-colors select-text whitespace-pre-wrap",
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
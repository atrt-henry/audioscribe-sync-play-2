export interface SubtitleSegment {
  id: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

// Convert SRT timestamp to seconds
export const timestampToSeconds = (timestamp: string): number => {
  const parts = timestamp.split(':');
  const secondsParts = parts[2].split(',');
  
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parseInt(secondsParts[0]);
  const milliseconds = parseInt(secondsParts[1]);
  
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};

// Parse SRT file content to subtitle segments
export const parseSRT = (srtContent: string): SubtitleSegment[] => {
  const segments: SubtitleSegment[] = [];
  const lines = srtContent.trim().split('\n');
  
  let i = 0;
  while (i < lines.length) {
    // Skip empty lines
    if (lines[i].trim() === '') {
      i++;
      continue;
    }
    
    // Parse segment ID
    const id = parseInt(lines[i]);
    i++;
    
    // Parse timestamp
    if (i >= lines.length) break;
    const timestampLine = lines[i];
    i++;
    
    const timestamps = timestampLine.split(' --> ');
    if (timestamps.length !== 2) {
      i++;
      continue;
    }
    
    const startTime = timestampToSeconds(timestamps[0]);
    const endTime = timestampToSeconds(timestamps[1]);
    
    // Parse text
    let text = '';
    while (i < lines.length && lines[i].trim() !== '') {
      text += (text ? '\n' : '') + lines[i];
      i++;
    }
    
    segments.push({
      id,
      startTime,
      endTime,
      text
    });
  }
  
  return segments;
};

// Find the current segment based on current playback time
export const findCurrentSegment = (
  segments: SubtitleSegment[],
  currentTime: number
): SubtitleSegment | null => {
  for (const segment of segments) {
    if (currentTime >= segment.startTime && currentTime <= segment.endTime) {
      return segment;
    }
  }
  return null;
};

// Format seconds to MM:SS display
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Format seconds to HH:MM:SS.mmm for SRT timestamps
export const formatSRTTimestamp = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
};

// Convert plain text to SRT format with estimated timing
export const textToSRT = (text: string, duration: number): string => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const timePerSentence = duration / sentences.length;
  
  let srt = '';
  sentences.forEach((sentence, index) => {
    const startTime = index * timePerSentence;
    const endTime = Math.min((index + 1) * timePerSentence, duration);
    
    srt += `${index + 1}\n`;
    srt += `${formatSRTTimestamp(startTime)} --> ${formatSRTTimestamp(endTime)}\n`;
    srt += `${sentence.trim()}\n\n`;
  });
  
  return srt;
};

// Convert segments array back to SRT format
export const segmentsToSRT = (segments: SubtitleSegment[]): string => {
  // Filter out empty segments
  const validSegments = segments.filter(segment => segment.text.trim().length > 0);
  
  let srt = '';
  
  validSegments.forEach((segment, index) => {
    srt += `${index + 1}\n`;
    srt += `${formatSRTTimestamp(segment.startTime)} --> ${formatSRTTimestamp(segment.endTime)}\n`;
    srt += `${segment.text}\n\n`;
  });
  
  return srt;
};

// Merge multiple segments into one
export const mergeSegments = (segments: SubtitleSegment[], segmentIdsToMerge: number[]): SubtitleSegment[] => {
  if (segmentIdsToMerge.length < 2) return segments;
  
  // Sort IDs to ensure proper order
  const sortedIds = [...segmentIdsToMerge].sort((a, b) => a - b);
  
  // Find the segments to merge
  const segmentsToMerge = segments.filter(seg => sortedIds.includes(seg.id));
  if (segmentsToMerge.length < 2) return segments;
  
  // Create merged segment
  const firstSegment = segmentsToMerge[0];
  const lastSegment = segmentsToMerge[segmentsToMerge.length - 1];
  
  const mergedSegment: SubtitleSegment = {
    id: firstSegment.id,
    startTime: firstSegment.startTime,
    endTime: lastSegment.endTime,
    text: segmentsToMerge.map(seg => seg.text).join(' ')
  };
  
  // Remove original segments and add merged one
  const newSegments = segments.filter(seg => !sortedIds.includes(seg.id));
  newSegments.push(mergedSegment);
  
  // Sort by start time and reassign IDs
  newSegments.sort((a, b) => a.startTime - b.startTime);
  return newSegments.map((seg, index) => ({ ...seg, id: index + 1 }));
};

// Split a segment at a specific time
export const splitSegment = (
  segments: SubtitleSegment[], 
  segmentId: number, 
  splitTime: number, 
  firstText?: string, 
  secondText?: string
): SubtitleSegment[] => {
  const segmentIndex = segments.findIndex(seg => seg.id === segmentId);
  if (segmentIndex === -1) return segments;
  
  const originalSegment = segments[segmentIndex];
  
  // Validate split time
  if (splitTime <= originalSegment.startTime || splitTime >= originalSegment.endTime) {
    return segments;
  }
  
  // If no custom text provided, split the original text roughly in half
  let firstPart = firstText;
  let secondPart = secondText;
  
  if (!firstPart || !secondPart) {
    const words = originalSegment.text.split(' ');
    const midPoint = Math.floor(words.length / 2);
    firstPart = firstPart || words.slice(0, midPoint).join(' ');
    secondPart = secondPart || words.slice(midPoint).join(' ');
  }
  
  // Create two new segments
  const firstSegment: SubtitleSegment = {
    id: originalSegment.id,
    startTime: originalSegment.startTime,
    endTime: splitTime,
    text: firstPart
  };
  
  const secondSegment: SubtitleSegment = {
    id: originalSegment.id + 1,
    startTime: splitTime,
    endTime: originalSegment.endTime,
    text: secondPart
  };
  
  // Replace original segment with two new ones
  const newSegments = [...segments];
  newSegments.splice(segmentIndex, 1, firstSegment, secondSegment);
  
  // Reassign IDs to maintain sequence
  return newSegments.map((seg, index) => ({ ...seg, id: index + 1 }));
};

// Update segment timing (for manual sync)
export const updateSegmentTiming = (
  segments: SubtitleSegment[], 
  segmentId: number, 
  newEndTime: number
): SubtitleSegment[] => {
  const segmentIndex = segments.findIndex(seg => seg.id === segmentId);
  if (segmentIndex === -1) return segments;
  
  const newSegments = [...segments];
  
  // Update the clicked segment's end time
  newSegments[segmentIndex] = {
    ...newSegments[segmentIndex],
    endTime: newEndTime
  };
  
  // Update the next segment's start time (if it exists)
  if (segmentIndex + 1 < newSegments.length) {
    newSegments[segmentIndex + 1] = {
      ...newSegments[segmentIndex + 1],
      startTime: newEndTime
    };
  }
  
  return newSegments;
};

// Update segment text
export const updateSegmentText = (
  segments: SubtitleSegment[], 
  segmentId: number, 
  newText: string
): SubtitleSegment[] => {
  const segmentIndex = segments.findIndex(seg => seg.id === segmentId);
  if (segmentIndex === -1) return segments;
  
  const newSegments = [...segments];
  newSegments[segmentIndex] = {
    ...newSegments[segmentIndex],
    text: newText
  };
  
  return newSegments;
};

// Delete a segment
export const deleteSegment = (
  segments: SubtitleSegment[], 
  segmentId: number
): SubtitleSegment[] => {
  const newSegments = segments.filter(seg => seg.id !== segmentId);
  
  // Reassign IDs to maintain sequence
  return newSegments.map((seg, index) => ({ ...seg, id: index + 1 }));
};
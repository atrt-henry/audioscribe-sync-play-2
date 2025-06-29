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

// CRITICAL FIX: More precise current segment detection
export const findCurrentSegment = (
  segments: SubtitleSegment[],
  currentTime: number
): SubtitleSegment | null => {
  // Add small tolerance for timing precision issues
  const tolerance = 0.1; // 100ms tolerance
  
  for (const segment of segments) {
    // Check if current time is within segment bounds (with tolerance)
    if (currentTime >= (segment.startTime - tolerance) && 
        currentTime <= (segment.endTime + tolerance)) {
      return segment;
    }
  }
  
  // If no exact match, find the closest segment
  let closestSegment: SubtitleSegment | null = null;
  let closestDistance = Infinity;
  
  for (const segment of segments) {
    // Calculate distance to segment
    let distance: number;
    
    if (currentTime < segment.startTime) {
      distance = segment.startTime - currentTime;
    } else if (currentTime > segment.endTime) {
      distance = currentTime - segment.endTime;
    } else {
      distance = 0; // Inside segment
    }
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestSegment = segment;
    }
  }
  
  // Only return closest segment if it's within reasonable range (5 seconds)
  return closestDistance <= 5 ? closestSegment : null;
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

// IMPROVED: Convert plain text to SRT format with much more precise timing
export const textToSRT = (text: string, duration: number): string => {
  // Split by sentences and phrases for better timing
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  if (sentences.length === 0) {
    return '';
  }
  
  // Calculate more precise timing based on text length and speech rate
  const averageWordsPerMinute = 150; // Average speaking rate
  const totalWords = sentences.reduce((count, sentence) => {
    return count + sentence.split(/\s+/).length;
  }, 0);
  
  // Calculate expected duration based on word count
  const expectedDuration = (totalWords / averageWordsPerMinute) * 60;
  const actualDuration = Math.min(duration, Math.max(expectedDuration, duration * 0.8));
  
  let srt = '';
  let currentTime = 0;
  
  sentences.forEach((sentence, index) => {
    const words = sentence.split(/\s+/).length;
    const wordRatio = words / totalWords;
    
    // Calculate segment duration based on word count ratio
    let segmentDuration = actualDuration * wordRatio;
    
    // Ensure minimum and maximum segment durations
    segmentDuration = Math.max(1.5, Math.min(segmentDuration, 8)); // 1.5s to 8s per segment
    
    const startTime = currentTime;
    const endTime = Math.min(currentTime + segmentDuration, duration);
    
    // Add small gap between segments to prevent overlap
    const gap = 0.1; // 100ms gap
    const adjustedEndTime = Math.min(endTime - gap, duration);
    
    srt += `${index + 1}\n`;
    srt += `${formatSRTTimestamp(startTime)} --> ${formatSRTTimestamp(adjustedEndTime)}\n`;
    srt += `${sentence.trim()}\n\n`;
    
    currentTime = endTime;
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

// Update segment timing (for manual sync) - FIXED VERSION
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
  
  // CRITICAL FIX: Ensure first segment always starts at 0
  if (segmentIndex === 0) {
    newSegments[0] = {
      ...newSegments[0],
      startTime: 0
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

// Delete a segment and fix timing
export const deleteSegment = (
  segments: SubtitleSegment[], 
  segmentId: number
): SubtitleSegment[] => {
  const segmentIndex = segments.findIndex(seg => seg.id === segmentId);
  if (segmentIndex === -1) return segments;
  
  const newSegments = [...segments];
  const deletedSegment = newSegments[segmentIndex];
  
  // Remove the segment
  newSegments.splice(segmentIndex, 1);
  
  // Fix timing: if we deleted the first segment, ensure the new first segment starts at 0
  if (segmentIndex === 0 && newSegments.length > 0) {
    newSegments[0] = {
      ...newSegments[0],
      startTime: 0
    };
  }
  
  // Reassign IDs to maintain sequence
  return newSegments.map((seg, index) => ({ ...seg, id: index + 1 }));
};

// Add a new segment
export const addSegment = (
  segments: SubtitleSegment[],
  position: 'beginning' | 'end' | number,
  text: string = 'New segment',
  duration: number = 5
): SubtitleSegment[] => {
  const newSegments = [...segments];
  
  if (position === 'beginning') {
    // Add at the beginning
    const firstSegment = newSegments[0];
    const newStartTime = 0;
    const newEndTime = firstSegment ? Math.min(duration, firstSegment.startTime) : duration;
    
    const newSegment: SubtitleSegment = {
      id: 1,
      startTime: newStartTime,
      endTime: newEndTime,
      text
    };
    
    // Adjust existing segments
    if (firstSegment) {
      newSegments[0] = {
        ...firstSegment,
        startTime: newEndTime
      };
    }
    
    newSegments.unshift(newSegment);
  } else if (position === 'end') {
    // Add at the end
    const lastSegment = newSegments[newSegments.length - 1];
    const newStartTime = lastSegment ? lastSegment.endTime : 0;
    const newEndTime = newStartTime + duration;
    
    const newSegment: SubtitleSegment = {
      id: newSegments.length + 1,
      startTime: newStartTime,
      endTime: newEndTime,
      text
    };
    
    newSegments.push(newSegment);
  } else if (typeof position === 'number') {
    // Add at specific index
    const insertIndex = Math.max(0, Math.min(position, newSegments.length));
    const prevSegment = newSegments[insertIndex - 1];
    const nextSegment = newSegments[insertIndex];
    
    let newStartTime: number;
    let newEndTime: number;
    
    if (prevSegment && nextSegment) {
      // Insert between two segments
      newStartTime = prevSegment.endTime;
      newEndTime = Math.min(newStartTime + duration, nextSegment.startTime);
      
      // Adjust next segment if needed
      if (newEndTime >= nextSegment.startTime) {
        newEndTime = newStartTime + Math.min(duration, (nextSegment.startTime - newStartTime) / 2);
        newSegments[insertIndex] = {
          ...nextSegment,
          startTime: newEndTime
        };
      }
    } else if (prevSegment) {
      // Add after last segment
      newStartTime = prevSegment.endTime;
      newEndTime = newStartTime + duration;
    } else {
      // Add as first segment
      newStartTime = 0;
      newEndTime = duration;
    }
    
    const newSegment: SubtitleSegment = {
      id: insertIndex + 1,
      startTime: newStartTime,
      endTime: newEndTime,
      text
    };
    
    newSegments.splice(insertIndex, 0, newSegment);
  }
  
  // Reassign IDs to maintain sequence
  return newSegments.map((seg, index) => ({ ...seg, id: index + 1 }));
};
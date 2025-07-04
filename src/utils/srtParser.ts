
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

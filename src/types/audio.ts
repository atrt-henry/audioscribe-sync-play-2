export interface AudioFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  duration: number;
  size: number;
  uploadedAt: Date;
  transcript: string | null;
  hasTranscript: boolean;
}

export interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export interface TranscriptSegment {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}
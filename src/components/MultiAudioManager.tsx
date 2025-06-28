import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileAudio, 
  FileText, 
  AlertCircle, 
  Grid3X3, 
  List,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import FileDropZone from './FileDropZone';
import AudioPlayerCard from './AudioPlayerCard';
import { AudioFile, UploadProgress } from '@/types/audio';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const SUPPORTED_AUDIO_FORMATS = ['.mp3', '.wav', '.m4a', '.ogg'];
const SUPPORTED_TRANSCRIPT_FORMATS = ['.srt', '.vtt'];

const MultiAudioManager: React.FC = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds the 100MB size limit`;
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAudio = SUPPORTED_AUDIO_FORMATS.includes(extension);
    const isTranscript = SUPPORTED_TRANSCRIPT_FORMATS.includes(extension);

    if (!isAudio && !isTranscript) {
      return `File "${file.name}" has an unsupported format. Supported formats: ${[...SUPPORTED_AUDIO_FORMATS, ...SUPPORTED_TRANSCRIPT_FORMATS].join(', ')}`;
    }

    return null;
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const errors: string[] = [];
    const validFiles: File[] = [];

    // Validate all files first
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    // Show validation errors
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      if (validFiles.length === 0) return;
    }

    setIsUploading(true);

    // Group files by type
    const audioFiles = validFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return SUPPORTED_AUDIO_FORMATS.includes(extension);
    });

    const transcriptFiles = validFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return SUPPORTED_TRANSCRIPT_FORMATS.includes(extension);
    });

    // Process audio files
    for (const file of audioFiles) {
      const fileId = `${Date.now()}-${Math.random()}`;
      
      // Add to upload progress
      setUploadProgress(prev => [...prev, {
        id: fileId,
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      }]);

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev => 
            prev.map(item => 
              item.id === fileId 
                ? { ...item, progress }
                : item
            )
          );
        }

        // Create audio URL
        const audioUrl = URL.createObjectURL(file);
        
        // Get audio duration
        const audio = new Audio(audioUrl);
        const duration = await new Promise<number>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration);
          });
        });

        const newAudioFile: AudioFile = {
          id: fileId,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          originalName: file.name,
          url: audioUrl,
          duration,
          size: file.size,
          uploadedAt: new Date(),
          transcript: null,
          hasTranscript: false
        };

        setAudioFiles(prev => [...prev, newAudioFile]);
        
        setUploadProgress(prev => 
          prev.map(item => 
            item.id === fileId 
              ? { ...item, status: 'completed' }
              : item
          )
        );

        toast.success(`Audio file "${file.name}" uploaded successfully`);

      } catch (error) {
        setUploadProgress(prev => 
          prev.map(item => 
            item.id === fileId 
              ? { ...item, status: 'error' }
              : item
          )
        );
        toast.error(`Failed to upload "${file.name}"`);
      }
    }

    // Process transcript files
    for (const file of transcriptFiles) {
      try {
        const content = await file.text();
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        
        // Try to match with existing audio file
        const matchingAudio = audioFiles.find(audio => 
          audio.name.toLowerCase() === baseName.toLowerCase()
        );

        if (matchingAudio) {
          setAudioFiles(prev => 
            prev.map(audio => 
              audio.id === matchingAudio.id
                ? { 
                    ...audio, 
                    transcript: content,
                    hasTranscript: true
                  }
                : audio
            )
          );
          toast.success(`Transcript linked to "${matchingAudio.name}"`);
        } else {
          toast.warning(`No matching audio file found for transcript "${file.name}"`);
        }
      } catch (error) {
        toast.error(`Failed to process transcript "${file.name}"`);
      }
    }

    // Clear upload progress after a delay
    setTimeout(() => {
      setUploadProgress([]);
      setIsUploading(false);
    }, 2000);

  }, [audioFiles]);

  const handleFileUpload = useCallback((files: FileList | File[]) => {
    processFiles(files);
  }, [processFiles]);

  const handleDeleteAudio = useCallback((id: string) => {
    setAudioFiles(prev => {
      const fileToDelete = prev.find(file => file.id === id);
      if (fileToDelete?.url) {
        URL.revokeObjectURL(fileToDelete.url);
      }
      return prev.filter(file => file.id !== id);
    });
    toast.success('Audio file deleted');
  }, []);

  const handleTranscriptUpdate = useCallback((id: string, transcript: string) => {
    setAudioFiles(prev => 
      prev.map(file => 
        file.id === id 
          ? { ...file, transcript, hasTranscript: true }
          : file
      )
    );
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = audioFiles.reduce((sum, file) => sum + file.size, 0);
  const totalDuration = audioFiles.reduce((sum, file) => sum + file.duration, 0);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Audio Library</h1>
          <p className="text-muted-foreground">
            Manage your audio files and transcripts
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {audioFiles.length} files
          </Badge>
          <Badge variant="outline">
            {formatFileSize(totalSize)}
          </Badge>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileDropZone 
            onFilesSelected={handleFileUpload}
            disabled={isUploading}
          />
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <FileAudio className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Audio Formats:</p>
                <p>{SUPPORTED_AUDIO_FORMATS.join(', ')}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Transcript Formats:</p>
                <p>{SUPPORTED_TRANSCRIPT_FORMATS.join(', ')}</p>
              </div>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Maximum file size: 100MB. Transcript files will be automatically linked to audio files with matching names.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadProgress.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{item.fileName}</span>
                  <span className="text-muted-foreground">
                    {item.status === 'completed' ? 'Completed' : 
                     item.status === 'error' ? 'Error' : 
                     `${item.progress}%`}
                  </span>
                </div>
                <Progress 
                  value={item.progress} 
                  className={`h-2 ${
                    item.status === 'error' ? 'bg-destructive/20' : ''
                  }`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Audio Files */}
      {audioFiles.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {audioFiles.map((audioFile) => (
            <AudioPlayerCard
              key={audioFile.id}
              audioFile={audioFile}
              viewMode={viewMode}
              onDelete={handleDeleteAudio}
              onTranscriptUpdate={handleTranscriptUpdate}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <FileAudio className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No audio files yet</h3>
                <p className="text-muted-foreground">
                  Upload your first audio file to get started
                </p>
              </div>
              <Button 
                onClick={() => document.getElementById('file-input')?.click()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Audio Files
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {audioFiles.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{audioFiles.length}</p>
                <p className="text-sm text-muted-foreground">Total Files</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {audioFiles.filter(f => f.hasTranscript).length}
                </p>
                <p className="text-sm text-muted-foreground">With Transcripts</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
                <p className="text-sm text-muted-foreground">Total Size</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.floor(totalDuration / 60)}m
                </p>
                <p className="text-sm text-muted-foreground">Total Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MultiAudioManager;
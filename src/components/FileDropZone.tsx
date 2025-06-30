import React, { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileAudio, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  disabled?: boolean;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ 
  onFilesSelected, 
  disabled = false 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected, disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [onFilesSelected]);

  const triggerFileInput = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div
      className={cn(
        "upload-zone relative rounded-xl p-12 text-center transition-all duration-300 ease-out",
        isDragOver && !disabled && "drag-over scale-[1.02]",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer hover:scale-[1.01]"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerFileInput}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp3,.wav,.m4a,.ogg,.srt,.vtt"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-xl pointer-events-none" />
      
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-20 animate-pulse" />
          
          {/* Icon container */}
          <div className="relative bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-full border border-primary/20">
            {isDragOver ? (
              <Sparkles className="h-8 w-8 text-primary animate-bounce" />
            ) : (
              <FileAudio className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
          </h3>
          <p className="text-muted-foreground">
            or click anywhere to browse your files
          </p>
        </div>

        <Button 
          variant="outline" 
          disabled={disabled}
          type="button"
          className="glass-effect hover:bg-primary/10 focus-ring"
          onClick={(e) => {
            e.stopPropagation();
            triggerFileInput();
          }}
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Files
        </Button>

        <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
          <p className="font-medium">Supported formats:</p>
          <p>🎵 Audio: MP3, WAV, M4A, OGG</p>
          <p>📝 Transcripts: SRT, VTT</p>
          <p className="text-xs opacity-75">Maximum file size: 100MB</p>
        </div>
      </div>
    </div>
  );
};

export default FileDropZone;
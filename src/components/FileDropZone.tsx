import React, { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileAudio } from 'lucide-react';
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

  const triggerFileInput = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!disabled && fileInputRef.current) {
      console.log('Triggering file input click'); // Debug log
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleDropZoneClick = useCallback((e: React.MouseEvent) => {
    // Only trigger if clicking on the drop zone itself, not child elements
    if (e.target === e.currentTarget) {
      triggerFileInput(e);
    }
  }, [triggerFileInput]);

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerFileInput(e);
  }, [triggerFileInput]);

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragOver && !disabled
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleDropZoneClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp3,.wav,.m4a,.ogg,.srt,.vtt"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
        style={{ zIndex: -1 }}
      />

      <div className="flex flex-col items-center gap-4 pointer-events-none">
        <div className="flex justify-center">
          <FileAudio className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <p className="text-lg font-medium">
            {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse your files
          </p>
        </div>

        <Button 
          variant="outline" 
          disabled={disabled}
          type="button"
          onClick={handleButtonClick}
          className="pointer-events-auto"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Files
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Supports: MP3, WAV, M4A, OGG (audio) • SRT, VTT (transcripts)</p>
          <p>Maximum file size: 100MB</p>
        </div>
      </div>
    </div>
  );
};

export default FileDropZone;
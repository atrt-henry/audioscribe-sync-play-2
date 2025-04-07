
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, FileAudio, FileText } from 'lucide-react';

interface FileUploadProps {
  onAudioUpload: (file: File) => void;
  onSrtUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onAudioUpload, onSrtUpload }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload a valid audio file');
      return;
    }
    
    setAudioFile(file);
    onAudioUpload(file);
    toast.success(`Audio file "${file.name}" loaded successfully`);
  };
  
  const handleSrtFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.srt')) {
      toast.error('Please upload a valid SRT file');
      return;
    }
    
    setSrtFile(file);
    onSrtUpload(file);
    toast.success(`SRT file "${file.name}" loaded successfully`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center w-full mb-6">
      <div className="flex flex-col items-center gap-2">
        <Button 
          variant="outline" 
          className="w-full relative overflow-hidden"
          onClick={() => document.getElementById('audio-upload')?.click()}
        >
          <FileAudio className="mr-2 h-4 w-4" />
          {audioFile ? 'Change Audio' : 'Upload Audio'}
          <input
            id="audio-upload"
            type="file"
            accept="audio/*" 
            onChange={handleAudioFileChange}
            className="hidden"
          />
        </Button>
        {audioFile && <p className="text-sm text-muted-foreground truncate max-w-[200px]">{audioFile.name}</p>}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button 
          variant="outline" 
          className="w-full relative overflow-hidden"
          onClick={() => document.getElementById('srt-upload')?.click()}
        >
          <FileText className="mr-2 h-4 w-4" />
          {srtFile ? 'Change SRT' : 'Upload SRT'}
          <input
            id="srt-upload"
            type="file"
            accept=".srt" 
            onChange={handleSrtFileChange}
            className="hidden"
          />
        </Button>
        {srtFile && <p className="text-sm text-muted-foreground truncate max-w-[200px]">{srtFile.name}</p>}
      </div>
    </div>
  );
};

export default FileUpload;

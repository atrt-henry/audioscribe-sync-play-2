import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Trash2, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Download,
  Edit3,
  Search,
  Sparkles,
  Loader2,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AudioFile } from '@/types/audio';
import TranscriptPanel from './TranscriptPanel';
import WaveformVisualization from './WaveformVisualization';
import AITranscriptionService from '@/services/AITranscriptionService';
import { toast } from 'sonner';

interface AudioPlayerCardProps {
  audioFile: AudioFile;
  viewMode: 'grid' | 'list';
  onDelete: (id: string) => void;
  onTranscriptUpdate: (id: string, transcript: string) => void;
}

const AudioPlayerCard: React.FC<AudioPlayerCardProps> = ({
  audioFile,
  viewMode,
  onDelete,
  onTranscriptUpdate
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => setIsLoaded(true);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        toast.error('Failed to play audio');
      });
    }
  };

  const handleSeek = (value: number[] | number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Array.isArray(value) ? value[0] : value;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkipBack = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, audio.currentTime - 10);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.min(audioFile.duration, audio.currentTime + 10);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    setVolume(newVolume);
    audio.volume = newVolume;
    
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      audio.muted = false;
    }
  };

  const handleMuteToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audio.muted = newMuted;
  };

  const handlePlaybackRateChange = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    setPlaybackRate(rate);
    audio.playbackRate = rate;
  };

  const handleGenerateTranscript = async () => {
    if (isGeneratingTranscript) return;

    try {
      setIsGeneratingTranscript(true);
      toast.info('Starting AI transcription...', {
        description: 'This may take a few minutes depending on the audio length.'
      });

      // Convert audio URL to File object for the AI service
      const response = await fetch(audioFile.url);
      const blob = await response.blob();
      const file = new File([blob], audioFile.originalName, { type: blob.type });

      const transcript = await AITranscriptionService.transcribeAudio(file);
      
      if (transcript) {
        onTranscriptUpdate(audioFile.id, transcript);
        setShowTranscript(true);
        toast.success('Transcript generated successfully!');
      } else {
        toast.error('Failed to generate transcript. Please check your AI settings.');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to generate transcript. Please try again.');
    } finally {
      setIsGeneratingTranscript(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${audioFile.name}"?`)) {
      onDelete(audioFile.id);
    }
  };

  const cardContent = (
    <>
      <audio
        ref={audioRef}
        src={audioFile.url}
        preload="metadata"
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate" title={audioFile.name}>
              {audioFile.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{formatTime(audioFile.duration)}</span>
              <span>•</span>
              <span>{formatFileSize(audioFile.size)}</span>
              {audioFile.hasTranscript && (
                <>
                  <span>•</span>
                  <Badge variant="secondary" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Interactive
                  </Badge>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {audioFile.hasTranscript && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
                className="h-8 w-8 p-0"
                title={showTranscript ? "Hide transcript" : "Show transcript"}
              >
                {showTranscript ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Delete audio file"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Waveform Visualization */}
        <WaveformVisualization
          audioUrl={audioFile.url}
          currentTime={currentTime}
          duration={audioFile.duration}
          isPlaying={isPlaying}
          onSeek={(time) => handleSeek([time])}
          className="mb-2"
        />

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={audioFile.duration}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(audioFile.duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipBack}
              disabled={!isLoaded}
              title="Skip back 10 seconds"
              className="h-8 w-8 p-0"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
              disabled={!isLoaded}
              className="h-10 w-10 p-0"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipForward}
              disabled={!isLoaded}
              title="Skip forward 10 seconds"
              className="h-8 w-8 p-0"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback Rate */}
            <div className="flex items-center gap-1">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                <Button
                  key={rate}
                  variant={playbackRate === rate ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handlePlaybackRateChange(rate)}
                  className="h-6 px-2 text-xs"
                >
                  {rate}x
                </Button>
              ))}
            </div>

            {/* Volume Control */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMuteToggle}
              className="h-8 w-8 p-0"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>
        </div>

        {/* AI Transcription Button */}
        {!audioFile.hasTranscript && (
          <div className="pt-2 border-t">
            <Button
              onClick={handleGenerateTranscript}
              disabled={isGeneratingTranscript}
              className="w-full"
              variant="outline"
            >
              {isGeneratingTranscript ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Interactive Transcript...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Interactive Transcript
                </>
              )}
            </Button>
          </div>
        )}

        {/* Interactive Transcript Panel */}
        {showTranscript && audioFile.hasTranscript && (
          <TranscriptPanel
            transcript={audioFile.transcript || ''}
            currentTime={currentTime}
            onSeek={handleSeek}
            onTranscriptUpdate={(transcript) => 
              onTranscriptUpdate(audioFile.id, transcript)
            }
          />
        )}
      </CardContent>
    </>
  );

  if (viewMode === 'list') {
    return (
      <Card className="w-full">
        {cardContent}
      </Card>
    );
  }

  return (
    <Card className="w-full">
      {cardContent}
    </Card>
  );
};

export default AudioPlayerCard;

import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { formatTime } from '@/utils/srtParser';

interface AudioControlsProps {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  playbackRate: number;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onRateChange: (rate: number) => void;
  isMuted: boolean;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  duration,
  currentTime,
  volume,
  playbackRate,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onRateChange,
  isMuted
}) => {
  const handleProgressChange = (values: number[]) => {
    onSeek(values[0]);
  };

  const handleVolumeChange = (values: number[]) => {
    onVolumeChange(values[0]);
  };

  return (
    <div className="flex flex-col p-4 border rounded-md shadow-sm bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={onSkipBack}
            title="Skip back 5 seconds"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            variant="default"
            onClick={onPlayPause}
            className="h-10 w-10 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onSkipForward}
            title="Skip forward 5 seconds"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={playbackRate === 0.75 ? "bg-secondary" : ""}
            onClick={() => onRateChange(0.75)}
          >
            0.75x
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={playbackRate === 1 ? "bg-secondary" : ""}
            onClick={() => onRateChange(1)}
          >
            Normal
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={playbackRate === 1.5 ? "bg-secondary" : ""}
            onClick={() => onRateChange(1.5)}
          >
            1.5x
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.01}
            onValueChange={handleProgressChange}
            className="flex-1"
          />
          <span className="text-sm w-10">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onToggleMute} 
            className="h-8 w-8"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-32"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioControls;

import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward
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
  playbackRate,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onSeek,
  onRateChange
}) => {
  const handleProgressChange = (values: number[]) => {
    onSeek(values[0]);
  };

  return (
    <div className="flex flex-col p-2 border rounded-md shadow-sm bg-white text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={onSkipBack}
            title="Skip back 5 seconds"
            className="h-7 w-7"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="default"
            onClick={onPlayPause}
            className="h-8 w-8 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={onSkipForward}
            title="Skip forward 5 seconds"
            className="h-7 w-7"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className={`text-xs px-1.5 py-0.5 h-6 ${playbackRate === 0.75 ? "bg-secondary" : ""}`}
            onClick={() => onRateChange(0.75)}
          >
            0.75x
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`text-xs px-1.5 py-0.5 h-6 ${playbackRate === 1 ? "bg-secondary" : ""}`}
            onClick={() => onRateChange(1)}
          >
            1x
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`text-xs px-1.5 py-0.5 h-6 ${playbackRate === 1.5 ? "bg-secondary" : ""}`}
            onClick={() => onRateChange(1.5)}
          >
            1.5x
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs w-8 text-right">
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.01}
          onValueChange={handleProgressChange}
          className="flex-1"
        />
        <span className="text-xs w-8">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default AudioControls;
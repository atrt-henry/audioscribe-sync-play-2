
import React from 'react';

interface AudioElementProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  src: string | null | undefined;
  onLoadedMetadata: () => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
}

const AudioElement: React.FC<AudioElementProps> = ({
  audioRef,
  src,
  onLoadedMetadata,
  onPlay,
  onPause,
  onEnded
}) => {
  return (
    <audio
      ref={audioRef}
      src={src || undefined}
      onLoadedMetadata={onLoadedMetadata}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      hidden
    />
  );
};

export default AudioElement;
